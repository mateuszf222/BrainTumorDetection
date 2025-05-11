<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { emitter, useWebSocketStore } from '../stores/websocket';

const message = ref('');
const messages = ref<any[]>([]);
const userList = ref<any[]>([]);
const receiver = ref('');
const sender = ref('');

const wsStore = useWebSocketStore();

const fetchMessages = async () => {
  if (!receiver.value) return;

  try {
    const res = await fetch(`/api/chat?user1=${sender.value}&user2=${receiver.value}`, {
      credentials: 'include'
    });
    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);

    const data = await res.json();
    messages.value = data.reverse().map((msg: any) => ({
      ...msg,
      status: msg.status || 'delivered' // Use existing status or fallback
    }));


  } catch (err) {
    console.error('Failed to fetch messages:', err);
  }
};

const ensureSender = async () => {
  try {
    const res = await fetch('/api/auth', { credentials: 'include' });
    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);

    const data = await res.json();
    if (data.username) {
      sender.value = data.username;
      wsStore.connect(sender.value);
      await fetchUsers();
    }
  } catch (err) {
    console.error('Failed to ensure sender:', err);
  }
};

const fetchUsers = async () => {
  if (!sender.value) return;

  try {
    const res = await fetch('/api/control/who', { credentials: 'include' });
    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);

    const users = await res.json();
    userList.value = Object.keys(users)
      .map(key => ({
        username: key,
        status: users[key].websocket ? 2 : (users[key].sessions > 0 ? 1 : 0)
      }))
      .filter(u => u.username !== sender.value);
  } catch (err) {
    console.error('Failed to fetch users:', err);
  }
};

const selectUser = async (username: string) => {
  receiver.value = username;
  
  // Mark messages as read immediately after selecting the user
  wsStore.send({
    type: 'read-receipt',
    from: sender.value,
    to: receiver.value
  });

  await fetchMessages();
};

const sendMessage = () => {
  if (!message.value.trim() || !receiver.value) return;

  const payload = {
    from: sender.value,
    to: receiver.value,
    message: message.value
  };

  messages.value.push({
    sender: sender.value,
    receiver: receiver.value,
    message: message.value,
    timestamp: Date.now(),
    status: 'sending'
  });

  wsStore.send(payload);
  message.value = '';
};

const handleIncomingMessage = (data: any) => {
  if (data.type === 'read-receipt') {
    // Mark messages as read for this conversation
    messages.value.forEach(msg => {
      if (msg.receiver === data.from && msg.sender === data.to) {
        msg.status = 'read';
      }
    });
    return;
  }

  const existing = messages.value.find(msg =>
    msg.message === data.message &&
    msg.sender === data.from &&
    msg.receiver === data.to &&
    msg.status === 'sending'
  );

  if (existing) {
    existing.status = 'delivered';
  } else {
    messages.value.push({
      sender: data.from,
      receiver: data.to,
      message: data.message,
      timestamp: Date.now(),
      status: 'delivered'
    });
  }
};

onMounted(async () => {
  await ensureSender();
  emitter.on('new-message', handleIncomingMessage);
});

onBeforeUnmount(() => {
  emitter.off('new-message', handleIncomingMessage);
});
</script>

<template>
  <div class="p-6 max-w-4xl mx-auto">
    <h2 class="text-2xl font-bold mb-4">User Chat</h2>

    <div class="mb-4">
      <label class="block text-sm font-medium mb-1">Users</label>
      <ul class="space-y-2">
        <li
          v-for="user in userList"
          :key="user.username"
          class="cursor-pointer text-blue-600 hover:underline"
          @click="selectUser(user.username)"
        >
          {{ user.username }}
          <span v-if="user.status === 2">(Online)</span>
          <span v-else-if="user.status === 1">(Session Active)</span>
          <span v-else>(Offline)</span>
        </li>
      </ul>
    </div>

    <div class="bg-white border border-gray-200 rounded-lg p-4 h-64 overflow-y-scroll mb-4 flex flex-col space-y-2">
      <div
        v-for="msg in messages"
        :key="msg._id || msg.timestamp"
        :class="msg.sender === sender ? 'self-end text-right bg-blue-100 text-blue-800 px-3 py-2 rounded-lg max-w-xs' : 'self-start text-left bg-gray-100 text-gray-800 px-3 py-2 rounded-lg max-w-xs'"
      >
        <strong>{{ msg.sender }}:</strong> {{ msg.message }}
        <div v-if="msg.sender === sender" class="text-xs text-gray-500 mt-1">
          {{
            msg.status === 'sending' ? 'Sending…' :
            msg.status === 'delivered' ? 'Delivered' :
            msg.status === 'read' ? 'Read' : ''
          }}
        </div>
      </div>
    </div>

    <div class="flex gap-2">
      <v-text-field
        v-model="message"
        label="Message"
        variant="outlined"
        class="flex-1"
        hide-details
      />
      <v-btn @click="sendMessage" color="primary">Send</v-btn>
    </div>
  </div>
</template>

<style scoped></style>
