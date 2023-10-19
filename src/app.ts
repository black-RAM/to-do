import { renderProject } from "./template";
import { pubSub } from "./pubsub";

type Scale = 1 | 2 | 3;

class ToDo {
  constructor(
    public title: string,
    public description: string,
    public due: Date,
    public priority: Scale
  ) { }
}

class Project {
  constructor(
    public name: string,
    public todos: ToDo[] = [],
    public icon: String = "bi-calendar-fill"
  ) {
    projects.push(this);
    if (todos) {
      renderProject(this);
    }
  }

  addToDo(todo: ToDo) {
    this.todos.push(todo);
    pubSub.publish("todo-added", todo);
  }

  deleteToDo(title: string) {
    this.todos = this.todos.filter(
      item => item.title !== title
    );
  }

  delete() {
    let index = projects.indexOf(this);
    projects.splice(index, 1);
  }
}

const projects: Project[] = [];

export { projects, Project, ToDo };