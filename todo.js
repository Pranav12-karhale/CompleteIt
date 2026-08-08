const input = document.getElementById("in");
const taskList = document.getElementById("task-list");

input.addEventListener("keydown", (e) => {
    if (e.code === 'Enter') {
        const text = input.value.trim();
        if (text) {
            addTask(text);
            input.value = "";
        }
    }
});

function addTask(text) {
    const li = document.createElement("li");
    li.className = "task-item";

    const span = document.createElement("span");
    span.className = "task-text";
    span.textContent = text;
    
    span.addEventListener("click", () => {
        li.classList.toggle("completed");
    });

    const btn = document.createElement("button");
    btn.className = "delete-btn";
    btn.innerHTML = "&times;";
    
    btn.addEventListener("click", () => {
        li.remove();
    });

    li.appendChild(span);
    li.appendChild(btn);
    taskList.appendChild(li);
}
