# BrainTumorDetection :brain:

BrainTumorDetection is a project that allows to analyze brain MRI scans to get to know whether result is positive or not.
Also facilitates the management of stored results.
It uses TypeScript, Node.js, Express.js, Vite.js, Vue.js, MongoDB, FastAPI, Python, YOLO AI models.

![photo_analysis](https://github.com/user-attachments/assets/55bbe4ef-f979-4003-87d3-0f0553547658)
![photo_analysis2](https://github.com/user-attachments/assets/17893866-2306-43a3-819d-275013c64f3e)
![photo_results_2](https://github.com/user-attachments/assets/0a902c30-16e4-48a1-9d66-f35aa1f7f5de)
![photo_results_3](https://github.com/user-attachments/assets/f73ce689-c18b-42d4-9342-fdeb29541aeb)
![photo_results_4](https://github.com/user-attachments/assets/428d8f98-881a-4b88-b863-7d01f9fe6fc1)


## Features :star2:
- Panel to load photo to the system and send to Python microservice using FastAPI in order to analyze the image 
- Panel to manage results of brain MRI scans allowing to update or delete data
- Server side tables allowing filtering, sorting, pagination

## Installation :hammer_and_wrench:

What you need:
- Visual Studio Code IDE
- Node.js
- npm (Node Package Manager) installed automatically with Node.js
- Python

Download dependencies:
```bash
npm install
cd brain-tumor-vue
npm install
```

Start backend:
```bash
npx tsx server.ts
```

Compiling the frontend to production:
```bash
cd brain-tumor-vue
npm run build
```

Launching the frontend development server:
```bash
cd brain-tumor-vue
npm run dev
```

Run analyzer.py file



## License :page_with_curl:
BrainTumorDetection is licensed under the GNU General Public License v3.0
