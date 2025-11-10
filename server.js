const express = require('express');
const cors = require('cors');
const { json } = require('body-parser');
const { Pool } = require('pg');

const server = express();
const pool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  database: 'l2db',
  user: 'postgres',
  password: 'root',
});

server.use(cors());
server.use(json());

async function checkAccountExists(login) {
  try {
    const result = await pool.query(
      'SELECT id FROM accounts WHERE login = $1',
      [login]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking account existence:', error);
    throw error;
  }
}

server.post('/account', async (request, response) => {
  const { login, password } = request.body;

  if (!login || !password) {
    response.status(400).json({
      status: 'failed',
      message: 'Login and password are required'
    });

    return
  }

  if (login.length < 1 || password.length < 1) {
    response.status(400).json({
      status: 'failed',
      message: 'Login must be at least 3 characters and password at least 6 characters'
    });

    return
  }

  try {
    const accountExists = await checkAccountExists(login);
    
    if (accountExists) {
      response.status(409).json({
        status: 'failed',
        message: 'Account with this login already exists'
      });

      return;
    }

    const result = await pool.query(
      'INSERT INTO accounts (login, password) VALUES ($1, $2) RETURNING id',
      [login, password]
    );

    response.status(201).json({
      status: 'success',
      message: 'Account created successfully',
    });

  } catch (error) {
    if (error.code === '23505') {
      response.status(409).json({
        status: 'failed',
        message: 'Account with this login already exists'
      });
    } else {
      console.error('Registration error:', error);
      response.status(500).json({
        status: 'failed',
        message: 'Internal server error'
      });
    }
  }
});

server.listen(80);