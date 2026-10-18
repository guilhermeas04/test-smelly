const { UserService } = require('../src/userService');

describe('UserService - Testes limpos', () => {
  let userService;

  beforeEach(() => {
    userService = new UserService();
    userService._clearDB();
  });

  test('deve criar um usuário adulto com os dados informados e status ativo', () => {
    // Arrange
    const nome = 'Alice';
    const email = 'alice@teste.com';
    const idade = 28;

    // Act
    const usuario = userService.createUser(nome, email, idade);

    // Assert
    expect(usuario).toEqual(expect.objectContaining({
      id: expect.any(String),
      nome,
      email,
      idade,
      status: 'ativo',
      isAdmin: false,
    }));
    expect(usuario.id).not.toBe('');
  });

  test('deve buscar os dados do usuário correspondente ao ID informado', () => {
    // Arrange
    const usuario = userService.createUser('Alice', 'alice@teste.com', 28);
    userService.createUser('Bob', 'bob@teste.com', 32);

    // Act
    const usuarioEncontrado = userService.getUserById(usuario.id);

    // Assert
    expect(usuarioEncontrado).toEqual(expect.objectContaining({
      id: usuario.id,
      nome: 'Alice',
      email: 'alice@teste.com',
      idade: 28,
      status: 'ativo',
    }));
  });

  test('deve desativar um usuário comum e informar sucesso', () => {
    // Arrange
    const usuario = userService.createUser('Comum', 'comum@teste.com', 30);

    // Act
    const resultado = userService.deactivateUser(usuario.id);

    // Assert
    expect(resultado).toBe(true);
    expect(userService.getUserById(usuario.id)).toEqual(
      expect.objectContaining({ status: 'inativo' })
    );
  });

  test('deve recusar a desativação de um administrador e mantê-lo ativo', () => {
    // Arrange
    const admin = userService.createUser('Admin', 'admin@teste.com', 40, true);

    // Act
    const resultado = userService.deactivateUser(admin.id);

    // Assert
    expect(resultado).toBe(false);
    expect(userService.getUserById(admin.id)).toEqual(
      expect.objectContaining({ status: 'ativo', isAdmin: true })
    );
  });

  test('deve incluir todos os usuários cadastrados no relatório', () => {
    // Arrange
    const alice = userService.createUser('Alice', 'alice@teste.com', 28);
    const bob = userService.createUser('Bob', 'bob@teste.com', 32);

    // Act
    const relatorio = userService.generateUserReport();

    // Assert
    expect(relatorio).toContain(alice.id);
    expect(relatorio).toContain('Alice');
    expect(relatorio).toContain(bob.id);
    expect(relatorio).toContain('Bob');
    expect(relatorio).toContain('ativo');
  });

  test('deve rejeitar a criação de usuário menor de idade', () => {
    // Arrange
    const nome = 'Menor';
    const email = 'menor@teste.com';
    const idade = 17;

    // Act: adia a execução para que a asserção capture a exceção.
    const criarUsuarioMenor = () => userService.createUser(nome, email, idade);

    // Assert
    expect(criarUsuarioMenor).toThrow('O usuário deve ser maior de idade.');
  });

  test('deve informar no relatório quando não há usuários cadastrados', () => {
    // Arrange: o beforeEach deixa o banco em memória vazio.

    // Act
    const relatorio = userService.generateUserReport();

    // Assert
    expect(relatorio).toContain('Nenhum usuário cadastrado');
  });
});
