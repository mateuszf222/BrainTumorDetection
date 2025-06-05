<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { emitter, useWebSocketStore } from '../stores/websocket';

const message = ref('');
const messages = ref<any[]>([]);
const userList = ref<any[]>([]);
const receiver = ref('');
const sender = ref('');
const selectedImage = ref<File | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const previewImageUrl = ref<string | null>(null);
const chatContainer = ref<HTMLElement | null>(null);


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
  await scrollToBottom();
};

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    selectedImage.value = target.files[0];
    previewImageUrl.value = URL.createObjectURL(selectedImage.value);
  }
};

const sendMessage = async () => {
  if (!receiver.value) return;

  const payload: any = {
    from: sender.value,
    to: receiver.value,
    message: message.value.trim() || ''
  };

  if (selectedImage.value) {
    // Wrap FileReader in a Promise
    const imageBase64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(selectedImage.value as File);
    });

    payload.image = imageBase64;

    wsStore.send(payload);

    messages.value.push({
      sender: sender.value,
      receiver: receiver.value,
      message: payload.message,
      image: payload.image,
      timestamp: Date.now(),
      status: 'sending'
    });

    message.value = '';
    selectedImage.value = null;
    previewImageUrl.value = null;
    return;
  }

  if (!message.value.trim()) return;

  // Send only text message
  wsStore.send(payload);

  messages.value.push({
    sender: sender.value,
    receiver: receiver.value,
    message: message.value,
    timestamp: Date.now(),
    status: 'sending'
  });

  message.value = '';
  scrollToBottom();
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
      image: data.image,  
      timestamp: Date.now(),
      status: 'delivered'
    });
  }

  scrollToBottom(); 
};

const scrollToBottom = async () => {
  await nextTick(); // wait for DOM update
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
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

    <div
      ref="chatContainer"
      class="bg-white border border-gray-200 rounded-lg p-4 h-64 overflow-y-scroll mb-4 flex flex-col space-y-2"
    >
      <div v-for="msg in messages" :key="msg._id || msg.timestamp" 
          :class="msg.sender === sender ? 'self-end text-right bg-blue-100 text-blue-800 px-3 py-2 rounded-lg max-w-xs' : 'self-start text-left bg-gray-100 text-gray-800 px-3 py-2 rounded-lg max-w-xs'">
        <strong>{{ msg.sender }}:</strong> 
        <span v-if="msg.message">{{ ` ${msg.message}` }}</span>
        
        <div v-if="msg.image">
          <img :src="msg.image" class="mt-2 max-w-xs max-h-48 object-contain rounded-lg" />
        </div>

        <div v-if="msg.sender === sender" class="text-xs text-gray-500 mt-1">
          {{
            msg.status === 'sending' ? 'Sending…' :
            msg.status === 'delivered' ? 'Delivered' :
            msg.status === 'read' ? 'Read' : ''
          }}
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-2 w-full">
    <div class="flex gap-2 items-end">
        <v-text-field 
          v-model="message"
          label="Message"
          variant="outlined"
          class="flex-1"
          hide-details>
          <div v-if="previewImageUrl" class="mb-1">
            <img :src="previewImageUrl" class="max-w-xs max-h-48 rounded border border-gray-300" />
          </div>
        </v-text-field>
        <v-btn @click="sendMessage" color="primary">Send</v-btn>
        <v-btn color="secondary" @click="fileInput?.click()">Attach Photo</v-btn>
        <input type="file" ref="fileInput" @change="handleFileUpload" class="hidden" />
      </div>
    </div>
  </div>
</template>

<style scoped></style>
