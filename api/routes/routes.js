'use strict';
module.exports = function(app) {
  var controller = require('../controllers/controller');

  /***check if the service is up***/
  app.route('/healthcheck')
    .get(controller.healthcheck);
  

  /***users management***/
  app.route('/user')
    .get(controller.list_all_users)
    .post(controller.create_a_user);

  app.route('/user/:userId')
    .get(controller.read_a_user)
    .put(controller.update_a_user)
    .delete(controller.delete_a_user);

  /***people management***/
  app.route('/person/:userId')
    .get(controller.list_people)
    .post(controller.create_a_person)
    .put(controller.update_a_person)
    .delete(controller.delete_a_person)
}