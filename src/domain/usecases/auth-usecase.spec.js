const { MissingParamError, InvalidParamError } = require('../../utils/errors/')

const AuthUseCase = require('./auth-usecase')

const makeLoadUserByEmailRepository = () => {
  class LoadUserByEmailRepositorySpy {
    async load (email) {
      this.email = email
      return this.user
    }
  }
  const loadUserByEmailRepository = new LoadUserByEmailRepositorySpy()
  loadUserByEmailRepository.user = {
    id: 'any_id',
    password: 'hashed_password'
  }
  return loadUserByEmailRepository
}
const makeUpdateAccessTokenRepository = () => {
  class UpdateAccessTokenRepositorySpy {
    async update (userId, accessToken) {
      this.userId = userId
      this.accessToken = accessToken
    }
  }
  return new UpdateAccessTokenRepositorySpy()
}
const makeLoadUserByEmailRepositoryWithError = () => {
  class LoadUserByEmailRepositorySpy {
    async load () {
      throw new Error()
    }
  }
  return new LoadUserByEmailRepositorySpy()
}
const makeEncrypterHelper = () => {
  class EncrypterHelperSpy {
    async compare (password, hashedPassword) {
      this.password = password
      this.hashedPassword = hashedPassword
      return this.isValid
    }
  }
  const encrypterHelperSpy = new EncrypterHelperSpy()
  encrypterHelperSpy.isValid = true
  return encrypterHelperSpy
}
const makeEncrypterHelperWithError = () => {
  class EncrypterHelperSpy {
    async compare () {
      throw new Error()
    }
  }
  return new EncrypterHelperSpy()
}
const makeTokenGenerator = () => {
  class TokenGeneratorSpy {
    async generate (userId) {
      this.userId = userId
      return this.accessToken
    }
  }
  const tokenGeneratorSpy = new TokenGeneratorSpy()
  tokenGeneratorSpy.accessToken = 'any_token'
  return tokenGeneratorSpy
}

const makeTokenGeneratorWithError = () => {
  class TokenGeneratorSpy {
    async generate () {
      throw new Error()
    }
  }
  return new TokenGeneratorSpy()
}

const makeSut = () => {
  const loadUserByEmailRepositorySpy = makeLoadUserByEmailRepository()
  const encrypterHelperSpy = makeEncrypterHelper()
  const tokenGeneratorSpy = makeTokenGenerator()
  const updateAccessTokenRepositorySpy = makeUpdateAccessTokenRepository()

  const sut = new AuthUseCase({
    loadUserByEmailRepository: loadUserByEmailRepositorySpy,
    encrypterHelper: encrypterHelperSpy,
    tokenGenerator: tokenGeneratorSpy,
    updateAccessTokenRepository: updateAccessTokenRepositorySpy
  })

  return {
    sut,
    loadUserByEmailRepositorySpy,
    encrypterHelperSpy,
    tokenGeneratorSpy,
    updateAccessTokenRepositorySpy
  }
}
describe('AuthUseCase', () => {
  test('Should throw if no email is provided', async () => {
    const { sut } = makeSut()
    const promise = sut.auth()
    await expect(promise).rejects.toThrow(new MissingParamError('email'))
  })
  test('Should throw if no password is provided', async () => {
    const { sut } = makeSut()
    const promise = sut.auth('any_email@mail.com')
    await expect(promise).rejects.toThrow(new MissingParamError('password'))
  })
  test('Should throw if no loadUserByEmail is provided', async () => {
    const sut = new AuthUseCase({})
    const promise = sut.auth('any_email@mail.com', 'any_password')
    expect(promise).rejects.toThrow(new MissingParamError('loadUserByEmailRepository'))
  })
  test('Should throw if loadUserByEmail has no load method', async () => {
    const sut = new AuthUseCase({ loadUserByEmailRepository: {} })
    const promise = sut.auth('any_email@mail.com', 'any_password')
    expect(promise).rejects.toThrow(new InvalidParamError('loadUserByEmailRepository'))
  })
  test('Should call LoadUserByEmailRepository with correct email', async () => {
    const { sut, loadUserByEmailRepositorySpy } = makeSut()
    sut.auth('any_email@mail.com', 'any_password')
    expect(loadUserByEmailRepositorySpy.email).toBe('any_email@mail.com')
  })
  test('Should return null if an invalid email is provided', async () => {
    const { sut, loadUserByEmailRepositorySpy } = makeSut()
    loadUserByEmailRepositorySpy.user = null
    const accessToken = await sut.auth('invalid_email@mail.com', 'any_password')
    expect(accessToken).toBeNull()
  })
  test('Should return null if an invalid password is provided', async () => {
    const { sut, encrypterHelperSpy } = makeSut()
    encrypterHelperSpy.isValid = false
    const accessToken = await sut.auth('valid_email@mail.com', 'invalid_password')
    expect(accessToken).toBeNull()
  })
  test('Should call EncrypterHelper with correct values', async () => {
    const { sut, loadUserByEmailRepositorySpy, encrypterHelperSpy } = makeSut()
    await sut.auth('valid_email@mail.com', 'any_password')
    expect(encrypterHelperSpy.password).toBe('any_password')
    expect(encrypterHelperSpy.hashedPassword).toBe(loadUserByEmailRepositorySpy.user.password)
  })
  test('Should call tokenGenerator with correct userId', async () => {
    const { sut, loadUserByEmailRepositorySpy, tokenGeneratorSpy } = makeSut()
    await sut.auth('valid_email@mail.com', 'any_password')
    expect(tokenGeneratorSpy.userId).toBe(loadUserByEmailRepositorySpy.user.id)
  })
  test('Should return an accessToken if correct credentials are provided', async () => {
    const { sut, tokenGeneratorSpy } = makeSut()
    const accessToken = await sut.auth('valid_email@mail.com', 'any_password')
    expect(accessToken).toBe(tokenGeneratorSpy.accessToken)
    expect(accessToken).toBeTruthy()
  })
  test('Should throw if invalid dependencies are provided', async () => {
    const invalid = {}
    const loadUserByEmailRepository = makeLoadUserByEmailRepository()
    const encrypterHelper = makeEncrypterHelper()
    const suts = [].concat(
      new AuthUseCase(),
      new AuthUseCase({
        loadUserByEmailRepository: null,
        encrypterHelper: null,
        tokenGenerator: null
      }),
      new AuthUseCase({
        loadUserByEmailRepository: invalid,
        tokenGenerator: null,
        encrypterHelper: null
      }),
      new AuthUseCase({
        loadUserByEmailRepository,
        encrypterHelper: null,
        tokenGenerator: null
      }),
      new AuthUseCase({
        loadUserByEmailRepository,
        encrypterHelper: invalid,
        tokenGenerator: null
      }),
      new AuthUseCase({
        loadUserByEmailRepository,
        encrypterHelper,
        tokenGenerator: invalid
      }),
      new AuthUseCase({
        loadUserByEmailRepository,
        encrypterHelper,
        tokenGenerator: null
      })
    )
    for (const sut of suts) {
      const promise = sut.auth('any_email@mail.com', 'any_password')
      expect(promise).rejects.toThrow()
    }
  })
  test('Should throw if dependency throws', async () => {
    const loadUserByEmailRepository = makeLoadUserByEmailRepository()
    const encrypterHelper = makeEncrypterHelper()
    const suts = [].concat(
      new AuthUseCase({
        loadUserByEmailRepository: makeLoadUserByEmailRepositoryWithError()
      }),
      new AuthUseCase({
        loadUserByEmailRepository,
        encrypterHelper: makeEncrypterHelperWithError()
      }),
      new AuthUseCase({
        loadUserByEmailRepository,
        encrypterHelper,
        tokenGenerator: makeTokenGeneratorWithError()
      })
    )
    for (const sut of suts) {
      const promise = sut.auth('any_email@mail.com', 'any_password')
      expect(promise).rejects.toThrow()
    }
  })
  test('Should call UpdateAccessTokenRepository with correct values ', async () => {
    const { sut, loadUserByEmailRepositorySpy, updateAccessTokenRepositorySpy, tokenGeneratorSpy } = makeSut()
    await sut.auth('valid_email@mail.com', 'valid_password')
    expect(updateAccessTokenRepositorySpy.userId).toBe(loadUserByEmailRepositorySpy.user.id)
    expect(updateAccessTokenRepositorySpy.accessToken).toBe(tokenGeneratorSpy.accessToken)
  })
})
