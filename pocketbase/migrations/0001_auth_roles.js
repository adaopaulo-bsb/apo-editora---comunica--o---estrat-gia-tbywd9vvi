// Módulo: auth — papéis do sistema (Autor, Editor da APO, Administrador).
// Apenas admin pode alterar o papel de um usuário; o usuário comum não pode
// promover a si mesmo.
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!users.fields.getByName('role')) {
      // Não-required: se o campo for required e o valor vier vazio, o PocketBase
      // rejeita o create do próprio cadastro público.
      users.fields.add(
        new SelectField({
          name: 'role',
          values: ['autor', 'editor', 'admin'],
          maxSelect: 1,
        }),
      )
    }
    // O usuário pode alterar os próprios dados, mas nunca o papel.
    users.updateRule = 'id = @request.auth.id && @request.body.role:changed = false'
    users.deleteRule = null // exclusão só por admin (painel/rota protegida)
    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    if (users.fields.getByName('role')) {
      users.fields.removeByName('role')
    }
    users.updateRule = 'id = @request.auth.id'
    users.deleteRule = 'id = @request.auth.id'
    app.save(users)
  },
)
