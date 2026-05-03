#!/usr/bin/env node
const bcrypt = require('bcrypt');
const { getApplicationDataSource, ApiUserEntity } = require('bizpark.core');

const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.error('Usage: node scripts/reset-password.js <email> <newPassword>');
  process.exit(1);
}

(async () => {
  const ds = getApplicationDataSource();
  if (!ds.isInitialized) {
    await ds.initialize();
  }
  try {
    const repo = ds.getRepository(ApiUserEntity);
    const user = await repo.findOne({ where: { email } });
    if (!user) {
      console.error(`User not found: ${email}`);
      process.exit(2);
    }
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await repo.save(user);
    console.log(`Password updated for ${email} (id: ${user.id})`);
  } finally {
    await ds.destroy();
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
