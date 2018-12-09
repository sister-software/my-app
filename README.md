# `<my-app />`

__Web apps without build tools.__

**Unreleased work in progress**

No Babel. No Webpack. MyApp lets you build with native custom HTML elements.

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <!-- Add your modules as script tags. -->
    <script type='module' src="https://unpkg.com/nirrius/my-app/my-app.js"></script>
    <script type='module' src="https://unpkg.com/nirrius/my-app/my-element.js"></script>
    <script>
      // ...Then natively import them — without a build step.
      import MyApp from '/vendor/my-app.js'
      import MyElement from '/vendor/my-app.js'

      // Create native custom elements.
      class TodoListPage extends MyElement {
        // Element scoped styles.
        styles = `
          .todos {
            border: 1px solid black;
          }
        `

        // Observe shared data from anywhere.
        observes = (myApp, parentElement) => ({
          data: {
            todos: myApp.todos
          },
          actions: {
            markTodoComplete: myApp.actions.markTodoComplete
          }
        })

        // Create event listeners.
        markTodoComplete = (todo) => {
          todo.complete = true
        }

        render (html) {
          return html`
            <div>
              <h1>Todo List</h1>

              <ul class="todos">
                ${this.data.todos.map(todo => html`
                  <li onClick=${this.actions.markTodoComplete.bind(this, todo.id)}>
                    ${todo.title}
                  </li>
                `)}
              </ul>
            </div>
          `
        }
      }

      const myApp = new MyApp({
        // Observable data.
        observable: {
          todos: {
            entries: [
              {id: 'abc123', title: 'Try MyApp', complete: true}
            ]
          },
          // Modify the data.
          actions: {
            markTodoComplete (todoId) {
              const todo = this.data.todos.find(todo => todo.id === todoId)
              todo.complete = true
            }
          }
        },
        routes: {
          // Map routes to custom elements.
          '/': TodoListPage
        }
      })

      document.body.appendChild(myApp)
    </script>
  </head>

  <body></body>
</html>
```
