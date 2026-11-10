// Módulo: auth — regra de cadastro público (Fase 1, correção de segurança).
// A coleção `users` nasceu com createRule = "" (aberto a qualquer anônimo),
// o que permitiria um POST anônimo em /api/collections/users/records com
// role: "admin" nascer administrador. Esta migração trava o cadastro público:
// só é aceito quando o papel enviado for exatamente "autor".
// As regras de list/view/update/delete NÃO são alteradas aqui — já estão
// corretas (update já impede trocar o próprio papel via :changed = false).
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.createRule = '@request.body.role = "autor"'
    app.save(users)
  },
  (app) => {
    // Reverte ao estado anterior: cadastro público sem restrição de papel.
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.createRule = ''
    app.save(users)
  },
)
