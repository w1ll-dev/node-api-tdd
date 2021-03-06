const { InvalidParamError, MissingParamError } = require('../../utils/errors')

module.exports = class AuthUseCase {
  constructor ({ loadUserByEmailRepository, encrypterHelper, tokenGenerator, updateAccessTokenRepository } = {}) {
    this.loadUserByEmailRepository = loadUserByEmailRepository
    this.updateAccessTokenRepository = updateAccessTokenRepository
    this.encrypterHelper = encrypterHelper
    this.tokenGenerator = tokenGenerator
  }

  async auth (email, password) {
    if (!email) {
      throw new MissingParamError('email')
    }
    if (!password) {
      throw new MissingParamError('password')
    }
    if (!this.loadUserByEmailRepository) {
      throw new MissingParamError('loadUserByEmailRepository')
    }
    if (!this.loadUserByEmailRepository.load) {
      throw new InvalidParamError('loadUserByEmailRepository')
    }
    const user = await this.loadUserByEmailRepository.load(email)
    const isValid = user && await this.encrypterHelper.compare(password, user.password)
    if (isValid) {
      const acecessToken = await this.tokenGenerator.generate(user.id)
      this.updateAccessTokenRepository.update(user.id, acecessToken)
      return acecessToken
    }
    return null
  }
}
