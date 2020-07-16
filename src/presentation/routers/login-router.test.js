class LoginRouter {
  route (httpRequest) {
    if (!httpRequest || !httpRequest.body) {
      return {
        status: 500
      }
    }
    const { email, password } = httpRequest.body
    if (!email || !password) {
      return {
        status: 400
      }
    }
  }
}

describe('Login Router', () => {
  test('Should return 400 if no email is provided', () => {
    // sut === system under test (component tested)
    const sut = new LoginRouter()
    const httpRequest = {
      body: {
        password: 'any_password'
      }
    }
    const httpResponse = sut.route(httpRequest)
    expect(httpResponse.status).toBe(400)
  })

  test('Should return 400 if no password is provided', () => {
    // sut === system under test
    const sut = new LoginRouter()
    const httpRequest = {
      body: {
        email: 'any_email@mail.com'
      }
    }
    const httpResponse = sut.route(httpRequest)
    expect(httpResponse.status).toBe(400)
  })

  test('Should return 500 if no httpRequest is provided', () => {
    // sut === system under test
    const sut = new LoginRouter()
    const httpResponse = sut.route()
    expect(httpResponse.status).toBe(500)
  })

  test('Should return 500 if no httpRequest has no body', () => {
    // sut === system under test
    const sut = new LoginRouter()
    const httpRequest = {}
    const httpResponse = sut.route(httpRequest)
    expect(httpResponse.status).toBe(500)
  })
})
