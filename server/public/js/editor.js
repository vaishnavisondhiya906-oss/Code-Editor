console.log("EDITOR JS LOADED");

const editor = CodeMirror.fromTextArea(
  document.getElementById("editor"),
  {
    mode: "text/x-c++src",
    theme: "dracula",
    lineNumbers: true,
    autoCloseBrackets: true
  }
);

/* DEFAULT CODE */
editor.setValue(`#include<iostream>
using namespace std;

int main(){
  int a;
  cin >> a;
  cout << a;
}`);

/* ELEMENTS */
const runBtn = document.getElementById("run");
const input = document.getElementById("input");
const output = document.getElementById("output");
const lang = document.getElementById("lang");

/* ================= SOCKET ================= */
const socket = new WebSocket("wss://online-code-editor-backend-vowg.onrender.com");

socket.onopen = () => console.log("WS Connected");
// socket.onerror = (e) => console.log("WS Error", e);
socket.onerror = (e) => {
  console.log("WS Error", e);
  alert("WebSocket connection failed ❌");
};
socket.onclose = () => console.log("WS Closed");

/* RECEIVE OUTPUT */
socket.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "output") {
    output.value += data.value;
    output.scrollTop = output.scrollHeight;
  }
};

/* RUN CODE */
runBtn.addEventListener("click", () => {


  if (socket.readyState !== WebSocket.OPEN) {
    alert("Server connecting... please wait");
    return;
  }

  output.value = "";

  socket.send(JSON.stringify({
    type: "start",
    code: editor.getValue(),
    lang: lang.value
  }));
});

/* INPUT SYSTEM */
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();

    socket.send(JSON.stringify({
      type: "input",
      value: input.value
    }));

    output.value += "\n> " + input.value + "\n";
    input.value = "";
  }
});

/* ================= PRACTICE MODE ================= */
const params = new URLSearchParams(window.location.search);
const questionId = params.get("id");

const questionBox = document.getElementById("questionBox");

if (questionId) {
  questionBox.style.display = "block";
  loadQuestion();
} else {
  questionBox.style.display = "none";
}

/* LOAD QUESTION */
async function loadQuestion() {
  try {
    const res = await fetch("https://online-code-editor-backend-vowg.onrender.com/api/questions");
    const data = await res.json();

    const q = data.find(item => item.id == questionId);

    if (q) {
      document.getElementById("qTitle").innerText = q.title;
      document.getElementById("qDesc").innerText = q.description;
    }

  } catch (err) {
    console.log(err);
  }
}

/* MARK COMPLETE */
const user = JSON.parse(localStorage.getItem("user"));

if (questionId && user) {
  document.getElementById("markDone").addEventListener("click", async () => {

    await fetch("https://online-code-editor-backend-vowg.onrender.com/api/progress", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId: user.id,
        questionId
      })
    });

    alert("✅ Marked Completed");
  });
}