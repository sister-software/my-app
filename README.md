# `<my-app />`

**Web apps without build tools.**

**Unreleased work in progress**

No Babel. No Webpack. MyApp lets you build with native custom HTML elements.

```css
:host {
  --primary-color-base: #ff0000;
}
```

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <link src="./theme.css" type="text/my-app-theme" />
    <!-- Add your modules as script tags. -->
    <script type="module" src="https://unpkg.com/nirrius/my-app/my-app.js"></script>
    <script type="module" src="https://unpkg.com/nirrius/my-app/my-element.js"></script>
    <script>
      // ...Then natively import them — without a build step.
      import MyApp from '/vendor/my-app.js'

      // Create native custom elements.
      MyApp.createElement('todo-list-page', {
        // Element scoped styles.
        styles(css) {
          css`
            :host {
              border: 1px dashed black;
            }
            .todos {
              border: 1px solid black;
            }
          `
        },

        methods: {
          markTodoComplete(event) {
            const {todoId} = event.target.dataset

            this.parentApp.sharable.markTodoComplete(todoId)
          }
        },

        render (html) {
          const {todos} = this.parentApp.sharable

          return html`
            <div>
              <h1>Todo List</h1>

              <ul class="todos">
                ${todos.entries.map(todo => html`
                  <li onClick=${this.markTodoComplete} data-todo-id=${todo.id}>
                    ${todo.title}
                  </li>
                `)}
              </ul>
            </div>
          `
        }
      }

      const myApp = new MyApp({
        // Share global data with child nodes.
        sharable: {
          todos: {
            entries: [
              {id: 'abc123', title: 'Try MyApp', complete: true}
            ],
            markTodoComplete (todoId) {
              const todo = this.todos.find(todo => todo.id === todoId)
              todo.complete = true
            }
          },
        },
        routes: {
          // Map routes to custom elements.
          '/': TodoListPage,
          login: LoginPage
        }
      })

      document.body.appendChild(myApp)
    </script>
  </head>

  <body></body>
</html>
```
