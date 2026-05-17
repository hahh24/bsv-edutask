const apiUrl = 'http://localhost:5000'

describe('Manipulating task todos', () => {
  let user
  let task

  const loginAndOpenTask = () => {
    cy.visit('/')

    cy.contains('div', 'Email Address')
      .find('input[type=text]')
      .type(user.email)

    cy.get('form').submit()

    cy.get('h1')
      .should('contain.text', `Your tasks, ${user.firstName} ${user.lastName}`)

    cy.contains('.title-overlay', task.title)
      .click({ force: true })

    cy.get('.popup-inner')
      .should('contain.text', task.title)
  }

  beforeEach(() => {
    const suffix = `${Date.now()}-${Cypress._.random(1000, 9999)}`
    user = {
      firstName: 'Todo',
      lastName: 'Tester',
      email: `todo.${suffix}@example.com`
    }
    task = {
      title: `R8 task ${suffix}`,
      description: 'Task used for R8 GUI tests',
      url: 'dQw4w9WgXcQ',
      todos: ['Initial todo']
    }

    cy.request({
      method: 'POST',
      url: `${apiUrl}/users/create`,
      form: true,
      body: user
    }).then((response) => {
      user.id = response.body._id.$oid

      return cy.request({
        method: 'POST',
        url: `${apiUrl}/tasks/create`,
        form: true,
        body: {
          userid: user.id,
          title: task.title,
          description: task.description,
          url: task.url,
          todos: task.todos
        }
      })
    })
  })

  afterEach(() => {
    if (user.id) {
      cy.request({
        method: 'DELETE',
        url: `${apiUrl}/users/${user.id}`,
        failOnStatusCode: false
      })
    }
  })

  it('R8UC1 creates a new active todo item with a non-empty description', () => {
    const newTodo = 'Read article notes'

    loginAndOpenTask()
    cy.intercept('POST', `${apiUrl}/todos/create`).as('createTodo')

    cy.get('.todo-list form').within(() => {
      cy.get('input[type=text]').type(newTodo)
      cy.get('input[type=submit]').click()
    })

    cy.wait('@createTodo')
    cy.contains('.todo-item', newTodo)
      .should('exist')
      .find('.checker')
      .should('have.class', 'unchecked')
  })

  it('R8UC1 keeps Add disabled while the todo description is empty', () => {
    loginAndOpenTask()

    cy.get('.todo-list form input[type=submit]')
      .should('be.disabled')
  })

  it('R8UC2 toggles an active todo item to done', () => {
    loginAndOpenTask()
    cy.intercept('PUT', `${apiUrl}/todos/byid/*`).as('toggleTodo')

    cy.contains('.todo-item', 'Initial todo')
      .find('.checker')
      .click()

    cy.wait('@toggleTodo')
    cy.contains('.todo-item', 'Initial todo')
      .find('.checker')
      .should('have.class', 'checked')
  })

  it('R8UC2 toggles a done todo item back to active', () => {
    loginAndOpenTask()
    cy.intercept('PUT', `${apiUrl}/todos/byid/*`).as('toggleTodo')

    cy.contains('.todo-item', 'Initial todo')
      .find('.checker')
      .click()
    cy.wait('@toggleTodo')

    cy.contains('.todo-item', 'Initial todo')
      .find('.checker')
      .click()
    cy.wait('@toggleTodo')

    cy.contains('.todo-item', 'Initial todo')
      .find('.checker')
      .should('have.class', 'unchecked')
  })

  it('R8UC3 deletes an existing todo item', () => {
    loginAndOpenTask()
    cy.intercept('DELETE', `${apiUrl}/todos/byid/*`).as('deleteTodo')

    cy.contains('.todo-item', 'Initial todo')
      .find('.remover')
      .click()

    cy.wait('@deleteTodo')
    cy.contains('.todo-item', 'Initial todo')
      .should('not.exist')
  })
})
