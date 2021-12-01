FROM rabbitmq:3-management
RUN echo '[rabbitmq_management,rabbitmq_management_visualiser,rabbitmq_amqp1_0].' > enabled_plugins
RUN rabbitmq-plugins enable rabbitmq_amqp1_0
