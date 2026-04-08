const bcrypt = require('bcryptjs');
const password = 'Admin2024';
const hash = bcrypt.hashSync(password, 10);

console.log('Password:', password);
console.log('Hash:', hash);
console.log('');
console.log('Copia este SQL y ejecutalo en DB Browser:');
console.log('');
console.log('DELETE FROM users WHERE username = \'admin\';');
console.log('INSERT INTO users (id, username, full_name, email, phone, password_hash, pin_hash, role, is_admin)');
console.log('VALUES (lower(hex(randomblob(16))), \'admin\', \'Axel Meza\', \'axel@hela.mx\', \'\', \'' + hash + '\', \'' + hash + '\', \'Dueño\', 1);');
