import { Category, Project, ToDo, allTasksCategory } from "./app";
import { addToDoForm, editToDoForm } from "./forms";
import { gamePanel, bank } from "./games";
import { pubSub } from "./pubsub";
import { format } from 'date-fns';
import "./style.scss";
import "./resizer.js";

const loadTime = 10

const projectContainer = document.createElement("section");
projectContainer.classList.add("to-do-page");

function showAllTasks() {
  renderProject(allTasksCategory)
}

function addProject(project: Project | Category) {
  // show all tasks on startup
  if (project.name === "All Tasks") {
    setTimeout(showAllTasks, loadTime)
  };

  const type = project instanceof Project ? "project" : "category";
  const projectList = document.getElementById(`${type}-list`);
  const listElement = document.createElement("li");
  const listText = document.createElement("p")
  const toDoCounter = document.createElement("span")
  toDoCounter.classList.add("counter")

  listText.appendChild(toDoCounter)
  listText.innerHTML += project.name
  listElement.appendChild(listText)

  if (project instanceof Project) {
    listElement.dataset.index = String(project.index)

    // move todo to this project when to-do dragged over
    listElement.addEventListener("dragover", function (e) {
      e.preventDefault()

      if(e.dataTransfer) {
        e.dataTransfer.dropEffect = "move"
      }
    })

    listElement.addEventListener("drop", function(e) {
      if(e.dataTransfer) {
        const data = e.dataTransfer.getData("text/plain")
        project.receiveDrop(data)
      }
    })

    // delete project button
    const deleteButton = document.createElement("button")
    deleteButton.innerHTML = '<i class="bi bi-trash3 fs-5"></i>';
    deleteButton.title = "delete project";
    deleteButton.addEventListener("click", () => {
      project.deleteSelf()
      showAllTasks()
    });
    listElement.appendChild(deleteButton);
  }

  listText.addEventListener("click", () => {
    renderProject(project)
  })

  projectList?.appendChild(listElement)
}

function renderProject(project: Project | Category) {
  // reset
  clearPage()
  projectContainer.classList.remove("game-page")
  projectContainer.classList.add("to-do-page")

  // wallpaper
  const randomImg = Math.floor(Math.random() * 10) + 1;
  projectContainer.style.backgroundImage = `url("./bg/img-${randomImg}.jpg")`
  projectContainer.style.backgroundPosition = "center"
  projectContainer.style.backgroundSize = "cover"

  // html element creation
  const heading = document.createElement("header");
  const titleDiv = document.createElement("div");
  const title = document.createElement("h2");
  const icon = document.createElement("i");
  const addIcon = document.createElement("i")
  title.innerText = project.name;
  title.classList.add("h1")
  icon.classList.add("bi");
  addIcon.classList.add("bi")
  icon.classList.add(`${project.icon}`);
  addIcon.classList.add("bi-journal-plus")

  titleDiv.appendChild(icon)
  titleDiv.appendChild(title)
  heading.appendChild(titleDiv)

  if (project instanceof Project) {
    addIcon.addEventListener("click", () => {
      addToDoForm(project, projectContainer, heading.getBoundingClientRect())
    })
    heading.appendChild(addIcon)
  }

  projectContainer.appendChild(heading)

  document.getElementsByTagName("main")[0].appendChild(projectContainer);

  if (project instanceof Project && project.initialTodos) {
    for (const todo of project.initialTodos) {
      project.addToDo(todo)
    }
    project.deleteInitialToDos()
  } else {
    project.todos.forEach(todo => {
      renderToDo([todo, project instanceof Project, true]);
    });
  }
}

function renderToDo(parameters: [toDo: ToDo, isProject: Boolean, external: Boolean]) {
  // spread parameters of tuple
  const [toDo, isProject, externalCall] = parameters,

  // HTML elements for to-do article
    element = document.createElement("article"),
    leftDiv = document.createElement("div"),
    rightDiv = document.createElement("div"),
    checkBox = document.createElement("input"),
    toDoTitle = document.createElement("label"),
    dueDateT = document.createElement("time"),
    detailsButton = document.createElement("button"),
    editButton = document.createElement("button"),
    deleteButton = document.createElement("button"),
    detailsModal = document.createElement("dialog"),
    closeDetailsModal = document.createElement("button");

  // attributes
  element.classList.add(`priority-${toDo.getPriorityWord()}`);
  checkBox.type = "checkbox";
  checkBox.classList.add("completeCheck");
  toDoTitle.htmlFor = "completeCheck";

  editButton.type = "button";
  deleteButton.type = "button";
  detailsButton.type = "button";
  closeDetailsModal.type = "button";

  editButton.title = "edit";
  deleteButton.title = "delete";
  detailsButton.classList.add("btn-outline-secondary");
  detailsModal.classList.add("details")
  closeDetailsModal.classList.add("close-details")

  // content
  toDoTitle.innerText = toDo.title;
  dueDateT.dateTime = String(toDo.due)
  dueDateT.innerText = format(toDo.due, "d LLL");
  detailsButton.innerText = "Details";
  editButton.innerHTML = '<i class="bi bi-pencil-square"></i>';
  deleteButton.innerHTML = '<i class="bi bi-trash"></i>';
  closeDetailsModal.innerHTML = '<i class="bi bi-x-square"></i>'
  detailsModal.innerHTML =
    `<h3>${toDo.title}</h3>
    <p><b>Project:</b> ${toDo.parent}</p>
    <p><b>Priority:</b> ${toDo.getPriorityWord()}</p>
    <p><b>Description:</b> ${toDo.description}</p>
    <p><b>Due Date:</b> ${format(toDo.due, "do MMMM, Y")}</p>`;

  if (toDo.checked) {
    checkBox.checked = true;
    element.classList.add("text-decoration-line-through")
  }

  if(toDo.isOverDue()) {
    element.classList.add("overdue")
  }

  // details button
  detailsButton.addEventListener("click", () => {
    detailsModal.showModal()

    // position modal
    const modalHeight = detailsModal.clientHeight
    const buttonPos = detailsButton.getBoundingClientRect()
    const buttonBottom = buttonPos.bottom + window.scrollY
    const buttonTooLow = window.innerHeight / 2 + 100 < buttonBottom

    if(buttonTooLow) {
      detailsModal.style.top = `${Math.ceil(buttonPos.top - modalHeight - 15)}px`
    } else {
      detailsModal.style.top = `${Math.ceil(buttonBottom) + 10}px`
    }

    detailsModal.style.right = `${buttonPos.right}px`
    
  })

  closeDetailsModal.addEventListener("click", () => {
    detailsModal.close()
  })

  // checkbox functionality
  checkBox.addEventListener("click", () => {
    toDo.toggleCheck()

    if (toDo.checked) {
      element.classList.add("text-decoration-line-through")
    } else {
      element.classList.remove("text-decoration-line-through")
    }
  })

  // also check off if title clicked
  toDoTitle.addEventListener("click", () => {
    toDo.toggleCheck()

    if (toDo.checked) {
      element.classList.add("text-decoration-line-through")
      checkBox.checked = true
    } else {
      element.classList.remove("text-decoration-line-through")
      checkBox.checked = false
    }
  })
  
  // finally, appending elements to the DOM
  detailsModal.appendChild(closeDetailsModal)

  leftDiv.appendChild(checkBox)
  leftDiv.appendChild(toDoTitle)

  rightDiv.appendChild(dueDateT)
  rightDiv.appendChild(detailsButton)
  rightDiv.appendChild(detailsModal)

  if (isProject) {
    // hide date on small screens
    if (projectContainer.clientWidth < 400) {
      dueDateT.classList.add("d-none")

    } else {
      // to-dos are draggable on desktop
      element.draggable = true

      element.addEventListener("dragstart", function(e) {
        const serialized = JSON.stringify(toDo)
        if(e.dataTransfer) {
          e.dataTransfer.setData("text/plain", serialized)
          e.dataTransfer.effectAllowed = "move"
        }
      })

      // tell user what just happened
      element.addEventListener("dragend", function(e) {
        if(e.dataTransfer?.dropEffect === "move") {
          renderMessage("Yay! To-do moved!")
        } else {
          renderMessage("Move failed.")
        }
      })
    }

    // edit button
    editButton.addEventListener("click", () => {
      editToDoForm(toDo, element, detailsButton.getBoundingClientRect())
    })

    // delete button
    deleteButton.addEventListener("click", () => {
      pubSub.publish(`deletion-in-${toDo.parent}`, toDo)
    })

    rightDiv.appendChild(editButton)
    rightDiv.appendChild(deleteButton)
    element.dataset.index = String(toDo.index);
  }

  element.appendChild(leftDiv);
  element.appendChild(rightDiv);

  if (externalCall) {
    projectContainer.appendChild(element);
  } else {
    return element
  }
}

function updateEditedToDo(toDo: ToDo) {
  const newRender = renderToDo([toDo, true, false])
  const oldRender = document.querySelector(`article[data-index="${toDo.index}"]`)
  const sister = document.querySelector(`article[data-index="${toDo.index + 1}"]`)

  if (newRender && oldRender) {
    projectContainer.insertBefore(newRender, sister)
    projectContainer.removeChild(oldRender)
  }
}

function updateToDoCounter(parameters: [index: number, shouldIncrement: Boolean]) {
  const [index, shouldIncrement] = parameters;
  const counter = document.querySelector(`ul#project-list > li[data-index="${index}"] .counter`)

  if (counter) {
    const currentCount = Number(counter.innerHTML)
    counter.innerHTML = String(shouldIncrement ? currentCount + 1 : currentCount - 1);
    if(counter.innerHTML === "0") counter.innerHTML = ""
  }
}

function clearPage() {
  projectContainer.innerHTML = ""
  projectContainer.style.background = "none"
}

function removeToDo(index: Number) {
  const deletion = document.querySelector(`article[data-index="${index}"]`)
  if (deletion) projectContainer.removeChild(deletion);
}

function removeProject(index: Number) {
  const deletedLI = document.querySelector(`li[data-index="${index}"]`)
  if (deletedLI) document.getElementById("project-list")?.removeChild(deletedLI)
}

function renderGamePanel() {
  clearPage()
  projectContainer.classList.replace("to-do-page", "game-page")

  // heading
  const header = document.createElement("h1")
  header.innerText = "Game Panel"
  projectContainer.appendChild(header)

  // creating card for each game
  const cardContainer = document.createElement("div")
  cardContainer.classList.add("card-container")

  for(const game of gamePanel.games) {
    const gameContainer = document.createElement("dialog")
    const gamePlay = document.createElement("iframe")
    const closeGame = document.createElement("button")
    const card = document.createElement("article")
    const thumbnail = document.createElement("img")
    const text = document.createElement("div")
    const title = document.createElement("h5")
    const cost = document.createElement("small")
    
    text.classList.add("card-body")
    thumbnail.classList.add("game-panel-img")

    thumbnail.src = game.iconFilePath
    thumbnail.title = "Click to play!"
    title.innerText = game.name
    cost.innerHTML = `Cost: <i class="bi bi-coin text-warning"></i> ${game.cost}`
    gamePlay.src = game.link

    closeGame.innerHTML = '<i class="bi bi-x-lg"></i>'

    thumbnail.addEventListener("click", () => {

      const userCanPay = bank.deduct(game.cost)

      if(userCanPay) {
        projectContainer.appendChild(gameContainer)
        gameContainer.showModal()
        renderMessage(`Paid ${game.cost} coins for a 5-minute gaming session.`, gameContainer)

        setTimeout(() => {
          gameContainer.close()
          renderMessage("Session done. Pay again to play.")
        }, gamePanel.minutes);
      } else {
        renderMessage("Not enough coins to pay. Complete more to-dos.")
      }
    })

    closeGame.addEventListener("click", () => {
      gameContainer.close()
      projectContainer.removeChild(gameContainer)

      bank.deposit(game.cost)
      renderMessage("Yay! Coins refunded")
    })

    text.appendChild(title)
    text.appendChild(cost)
    card.appendChild(thumbnail)
    card.appendChild(text)
    cardContainer.appendChild(card)
    gameContainer.appendChild(closeGame)
    gameContainer.appendChild(gamePlay)
  }
  
  projectContainer.appendChild(cardContainer)
}

document.getElementById("game-icon")?.addEventListener("click", renderGamePanel)

function renderMessage(message: string, container = projectContainer) {
  const goodNews = message.startsWith("Yay!")
  const textBox = document.createElement("aside")
  const background = document.createElement("div")
  const text = document.createElement("p")
  text.innerText = message

  background.classList.add(`bg-${goodNews ? "success": "danger"}-subtle`)
  textBox.classList.add("message")

  background.appendChild(text)
  textBox.appendChild(background)
  textBox.style.width = `calc(${container.clientWidth}px - 3rem)`
  container.appendChild(textBox)
  setTimeout(() => {
    const pageNotChanged = [...container.childNodes].includes(textBox)
    if(pageNotChanged) {
      container.removeChild(textBox)
    }
  }, 3000);
}

pubSub.subscribe("todo-added", renderToDo);
pubSub.subscribe("todo-updated", updateEditedToDo)
pubSub.subscribe("todo-counted", updateToDoCounter)
pubSub.subscribe("todo-deleted", removeToDo)
pubSub.subscribe("project-deleted", removeProject)
pubSub.subscribe("coin-message", renderMessage)

export { addProject, showAllTasks }