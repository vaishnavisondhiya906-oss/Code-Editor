const tbody = document.getElementById("question-list");

const user = JSON.parse(localStorage.getItem("user")|| "null");


if (!user) {
  alert("Please login first");
  window.location.href = "login.html";
}

async function loadQuestions(){
  try {
    const res = await fetch(`https://code-editor-skya.onrender.com/api/progress/${user.id}`);
    const data = await res.json();

    tbody.innerHTML = "";

    if (!data.length) {
      tbody.innerHTML = `<tr><td colspan="3">No Questions Found</td></tr>`;
      return;
    }

    data.forEach(q=>{
      tbody.innerHTML += `
        <tr>
          <td>${q.id}</td>
          <td>
            <a href="editor.html?id=${q.id}" class="text-info">
              ${q.title}
            </a>
          </td>
          <td>
            ${q.solved 
              ? '<span class="badge bg-success">Solved</span>' 
              : '<span class="badge bg-warning text-dark">Pending</span>'}
          </td>
        </tr>
      `;
    });

  } catch (err) {
    console.log(err);
    tbody.innerHTML = `<tr><td colspan="3">Server Error</td></tr>`;
  }
}

loadQuestions();