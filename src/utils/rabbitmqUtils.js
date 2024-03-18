exports.sendMsgToRabbitMQ = async (queue, msg) => {
    const amqpServer = "amqp://guest:guest@rabbitmq:5672"
    const connection = await amqp.connect(amqpServer)
    const channel = await connection.createChannel();
    await channel.assertQueue(queue);
    await channel.sendToQueue(queue, Buffer.from(JSON.stringify(msg)))
    await channel.close();
    await connection.close();
}