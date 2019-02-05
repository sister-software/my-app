# Progressive Web Components

**Unreleased work in progress**

No Babel. No Webpack. Progressive Web Components let you build full web apps native custom HTML elements.

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
    <script src="https://unpkg.com/progressive-web-components/loader.js"></script>
    <script type="module" src="https://unpkg.com/@progressive-web-components/web-component.js"></script>

    <!-- Declare your components with minimal JavaScript -->

    <web-component tag-name="human-time">
      <observed-attribute name="date" type="number" required></observed-attribute>

      <template>
        <span title="${this.observedAttributes.date}">${this.humanizedTime()}</span>
      </template>

      <script type="module">
        import moment from './node_modules/moment/moment.js'

        this.humanizedTime = () => {
          return moment.fromNow(this.observedAttributes.date)
        }

        this.addEventListener('afterInsert', () => {
          this.interval = setInterval(() => {
            this.requestTemplateUpdate()
          }, 1000 * 60)
        })

        this.addEventListener('beforeRemove', () => {
          clearInterval(this.interval)
        })
      </script>
    </web-component>

    <!-- ...Or reference components in separate files -->

    <web-component src="/components/human-time.component.html"></web-component>

    <!-- ...Or declare them as JavaScript classes for total control -->

    <script type="module">
      import WebComponent from 'node_modules/@progressive-web-components/web-component.js`
      import moment from './node_modules/moment/moment.js'

      class HumanTime extends WebComponent {
        static tagName = 'human-time'

        static observedAttributes = {
          date: {
            type: Date,
            required: true
          }
        }

        onafterinsert() {
          this.interval = setInterval(() => {
            this.requestTemplateUpdate()
          }, 1000 * 60)

        }

        onbeforeremove() {
          clearInterval(this.interval)
        }

        humanizedTime() {
          return moment.fromNow(this.observedAttributes.date)
        }

        template(html) {
          return html`
            <span title="${this.observedAttributes.date}">${this.humanizedTime()}</span>
          `
        }
      }
    </script>

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
            const { todoId } = event.target.dataset

            this.parentApp.sharable.markTodoComplete(todoId)
          }
        },

        render(html) {
          const { todos } = this.parentApp.sharable

          return html`
            <div>
              <h1>Todo List</h1>

              <ul class="todos">
                ${
                  todos.entries.map(
                    todo => html`
                      <li onClick=${this.markTodoComplete} data-todo-id=${todo.id}>${todo.title}</li>
                    `
                  )
                }
              </ul>
            </div>
          `
        }
      })

      const myApp = new MyApp({
        // Share global data with child nodes.
        sharable: {
          todos: {
            entries: [{ id: 'abc123', title: 'Try MyApp', complete: true }],
            markTodoComplete(todoId) {
              const todo = this.todos.find(todo => todo.id === todoId)
              todo.complete = true
            }
          }
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

## Theming (WIP)

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" type="text/css" media="screen" href="main.css" />
  <script type="module" src="material-button.js"></script>
</head>
<body>
  <my-theme>
    <style>
      /* Global theme variables. */
      :root {
        --font-size: 16px;
        --color: #111;
      }

      /* Element overrides */
      material-button::part(text) {
        font-style: italic;
      }
    </style>

    <material-button>Click me!</material-button>
  <my-theme>
</body>
</html>
```
