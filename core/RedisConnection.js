import {createClient} from 'redis';

class RedisConnection {
    static instance = null;
    static publisherClient;
    static subscriberClient;
    options         = {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    };

    constructor() {
        if (RedisConnection.instance) {
            throw new Error('Use RedisClient.getInstance() instead of creating a new instance.');
        }

        this.client = null;
    }

    async create() {
        if (!this.client) {
            this.client = createClient(this.options);

            this.client.on('error', (err) => {
                console.error('Redis error:', err);
            });

            await this.client.connect();
            await this.client.flushDb();
            console.log('Redis Connection created');
        }
    }

    static async getPublisherClient() {
        if (!this.publisherClient) {
            this.publisherClient = createClient(this.options);
            this.publisherClient.on('error', (err) => console.error('Publisher Redis error:', err));
            await this.publisherClient.connect();
        }
        return this.publisherClient;
    }

    static async getSubscriberClient() {
        if (!this.subscriberClient) {
            this.subscriberClient = createClient(this.options);
            this.subscriberClient.on('error', (err) => console.error('Subscriber Redis error:', err));
            await this.subscriberClient.connect();
        }
        return this.subscriberClient;
    }

    static async getInstance() {
        if (!RedisConnection.instance) {
            RedisConnection.instance = new RedisConnection();
            await RedisConnection.instance.create();
        }

        return RedisConnection.instance.client;
    }
}

export default RedisConnection;

