<script setup lang="ts">
import { ref, onMounted } from 'vue';

const message = ref('');
const messages = ref<any[]>([]);
const userList = ref<any[]>([]);
const receiver = ref('');
const sender = ref('');

// Fetch messages from DB based on selected receiver
const fetchMessages = async () => {
  if (!receiver.value) return;

  try {
    const res = await fetch(`/api/chat?user1=${sender.value}&user2=${receiver.value}`, {
      credentials: 'include'
    });
    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);

    const data = await res.json();
    messages.value = data.reverse();
  } catch (err) {
    console.error('Failed to fetch messages:', err);
  }
};

// Ensure the current user is identified
const ensureSender = async () => {
  try {
    const res = await fetch('/api/auth', { credentials: 'include' });
    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);

    const data = await res.json();
    if (data.username) {
      sender.value = data.username;
      await fetchUsers();
    }
  } catch (err) {
    console.error('Failed to ensure sender:', err);
  }
};

// Fetch available users
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

// When clicking a username, set the receiver and load messages
const selectUser = async (username: string) => {
  receiver.value = username;
  await fetchMessages();
};

const sendMessage = async () => {
  if (!message.value.trim() || !receiver.value) return;

  const payload = {
    sender: sender.value,
    receiver: receiver.value,
    message: message.value
  };

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      message.value = '';
      await fetchMessages();
    }
  } catch (err) {
    console.error('Failed to send message:', err);
  }
};

onMounted(async () => {
  await ensureSender();
});
</script>

<!-- Chat.vue Updated Template for Message Alignment -->
<template>
  <div class="p-6 max-w-4xl mx-auto">
    <h2 class="text-2xl font-bold mb-4">User Chat</h2>

    <!-- User List -->
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

    <!-- Chat Messages with Aligned Layout -->
    <div class="bg-white border border-gray-200 rounded-lg p-4 h-64 overflow-y-scroll mb-4 flex flex-col space-y-2">
      <div
        v-for="msg in messages"
        :key="msg._id"
        :class="msg.sender === sender ? 'self-end text-right bg-blue-100 text-blue-800 px-3 py-2 rounded-lg max-w-xs' : 'self-start text-left bg-gray-100 text-gray-800 px-3 py-2 rounded-lg max-w-xs'"
      >
        <strong>{{ msg.sender }}:</strong> {{ msg.message }}
      </div>
    </div>

    <!-- Message Input -->
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

