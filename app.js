const koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const { Pool, Client } = require('pg');
const { resourceLimits } = require('worker_threads');
const e = require('express');
const jwt = require('jsonwebtoken');

const app = new koa();
const router = new Router();

const pool = new Pool({
    user: 'your_user',
    host: 'localhost',
    database: 'your_database',
    password: 'your_password',
    port: 5432,
});

app.use(bodyParser());

router.post('/register',async (ctx) => {
    const { name, email, password } = ctx.request.body;

    try{
        const client = await pool.connect();
        const result = await Client.query('INSERT INTO users(name,email,password) VALUES($1,$2,$3)',[name, email, password]);
        client.release();
        ctx.body = { message: 'User registered successfully' };
    } catch (err) {
        ctx.body = { message: 'Error while registering the user'};
    }
});

router.post('/login',async (ctx) => {
    const { email,password } = ctx.request.body;

    try{
        const client = await pool.connect();
        const result = await client.query('SELECT name, email, password FROM users WHERE email=$1',[email]);
        client.release();

        if (resourceLimits.rows.length == 0) {
            ctx.body = { message: 'User not found'};
        } else if (result.rows[0].password !== password) {
            ctx.body = { message: 'Incorrect password' };
        } else {
            const token = generateToken(result.rows[0]);
            ctx.body = { name: result.rows[0].name, email: result.rows[0].email, token };
        }
    } catch (err) {
        ctx.body = { message: 'Error while logging in'};
    }
});


function generateToken(user) {
    const token = jwt.sign({ userId: user.id }, 'my-secret-key', { expiresIn: '1h' });
    return token;
}

app.use(router.routes());
app.use(router.allowedMethods());

app.listen(3000);