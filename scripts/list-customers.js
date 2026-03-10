import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

const CustomerSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: String,
});

const Customer = mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);

async function main() {
  await mongoose.connect(MONGODB_URI);
  const customers = await Customer.find({}).select('name phone email').limit(10).lean();

  console.log('\n=== Customer Portal Login Info ===\n');
  customers.forEach((c, i) => {
    console.log(`${i + 1}. Name:  ${c.name}`);
    console.log(`   Phone: ${c.phone}`);
    if (c.email) console.log(`   Email: ${c.email}`);
    console.log('');
  });

  await mongoose.disconnect();
}

main().catch(console.error);
