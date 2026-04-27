import 'dotenv/config';
import { db } from './db';
import { sports, footballTeams, horses, jockeys, events, markets, odds, users, wallets } from './db/schema';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('Seeding database...');

  try {
    // Create sports
    console.log('Creating sports...');
    const [footballSport] = await db.insert(sports).values([
      { code: 'football', name: 'Football' },
      { code: 'horse_racing', name: 'Horse Racing' },
    ]).returning();

    const horseRacingSport = await db.select().from(sports).where(eq(sports.code, 'horse_racing')).limit(1);

    // Create football teams
    console.log('Creating football teams...');
    await db.insert(footballTeams).values([
      { name: 'Manchester United', shortName: 'MUN', country: 'England', attackRating: 85, midfieldRating: 82, defenseRating: 80, formRating: 75 },
      { name: 'Liverpool', shortName: 'LIV', country: 'England', attackRating: 88, midfieldRating: 85, defenseRating: 82, formRating: 80 },
      { name: 'Chelsea', shortName: 'CHE', country: 'England', attackRating: 83, midfieldRating: 84, defenseRating: 85, formRating: 78 },
      { name: 'Arsenal', shortName: 'ARS', country: 'England', attackRating: 84, midfieldRating: 86, defenseRating: 83, formRating: 82 },
      { name: 'Real Madrid', shortName: 'RMA', country: 'Spain', attackRating: 90, midfieldRating: 88, defenseRating: 85, formRating: 85 },
      { name: 'Barcelona', shortName: 'BAR', country: 'Spain', attackRating: 87, midfieldRating: 86, defenseRating: 84, formRating: 80 },
    ]);

    // Create horses
    console.log('Creating horses...');
    const [horse1] = await db.insert(horses).values([
      { name: 'Thunder Strike', age: 4, speed: 85, stamina: 80, acceleration: 82, consistency: 75, preferredDistance: 1200 },
      { name: 'Silver Bullet', age: 5, speed: 88, stamina: 85, acceleration: 90, consistency: 80, preferredDistance: 1400 },
      { name: 'Midnight Runner', age: 3, speed: 82, stamina: 88, acceleration: 78, consistency: 85, preferredDistance: 1600 },
      { name: 'Golden Gale', age: 4, speed: 86, stamina: 82, acceleration: 84, consistency: 78, preferredDistance: 1200 },
      { name: 'Storm Chaser', age: 6, speed: 84, stamina: 90, acceleration: 80, consistency: 82, preferredDistance: 1800 },
      { name: 'Wind Dancer', age: 3, speed: 80, stamina: 78, acceleration: 88, consistency: 88, preferredDistance: 1000 },
    ]).returning();

    // Create jockeys
    console.log('Creating jockeys...');
    const [jockey1] = await db.insert(jockeys).values([
      { name: 'John Smith', experience: 75, skillRating: 82, aggression: 60 },
      { name: 'Mike Johnson', experience: 80, skillRating: 85, aggression: 55 },
      { name: 'David Williams', experience: 70, skillRating: 78, aggression: 65 },
      { name: 'Robert Brown', experience: 85, skillRating: 88, aggression: 50 },
      { name: 'James Davis', experience: 65, skillRating: 75, aggression: 70 },
      { name: 'William Miller', experience: 90, skillRating: 90, aggression: 45 },
    ]).returning();

    // Create sample events
    console.log('Creating events...');

    // Football match
    const [footballEvent] = await db.insert(events).values([
      {
        sportId: footballSport.id,
        name: 'Manchester United vs Liverpool',
        startTime: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
        status: 'scheduled',
      },
    ]).returning();

    // Horse race
    const [horseRaceEvent] = await db.insert(events).values([
      {
        sportId: horseRacingSport[0].id,
        name: 'Golden Sprint Stakes',
        startTime: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
        status: 'scheduled',
      },
    ]).returning();

    // Create markets for football match
    console.log('Creating markets...');
    const [footballMarket] = await db.insert(markets).values([
      {
        eventId: footballEvent.id,
        marketType: 'match_winner',
        name: 'Match Winner',
        status: 'open',
      },
    ]).returning();

    // Create odds for football match
    await db.insert(odds).values([
      { marketId: footballMarket.id, selectionId: 'home', selectionName: 'Manchester United', decimalOdds: '2.50', isActive: true },
      { marketId: footballMarket.id, selectionId: 'draw', selectionName: 'Draw', decimalOdds: '3.20', isActive: true },
      { marketId: footballMarket.id, selectionId: 'away', selectionName: 'Liverpool', decimalOdds: '2.80', isActive: true },
    ]);

    // Create market for horse race
    const [horseMarket] = await db.insert(markets).values([
      {
        eventId: horseRaceEvent.id,
        marketType: 'race_winner',
        name: 'Race Winner',
        status: 'open',
      },
    ]).returning();

    // Create odds for horse race
    await db.insert(odds).values([
      { marketId: horseMarket.id, selectionId: '1', selectionName: 'Thunder Strike', decimalOdds: '3.50', isActive: true },
      { marketId: horseMarket.id, selectionId: '2', selectionName: 'Silver Bullet', decimalOdds: '2.80', isActive: true },
      { marketId: horseMarket.id, selectionId: '3', selectionName: 'Midnight Runner', decimalOdds: '4.20', isActive: true },
      { marketId: horseMarket.id, selectionId: '4', selectionName: 'Golden Gale', decimalOdds: '3.80', isActive: true },
      { marketId: horseMarket.id, selectionId: '5', selectionName: 'Storm Chaser', decimalOdds: '5.00', isActive: true },
      { marketId: horseMarket.id, selectionId: '6', selectionName: 'Wind Dancer', decimalOdds: '6.50', isActive: true },
    ]);

    // Create test user
    console.log('Creating test user...');
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash('password123', 10);

    const [testUser] = await db.insert(users).values([
      {
        email: 'test@example.com',
        passwordHash,
        displayName: 'Test User',
        role: 'user',
      },
    ]).returning();

    // Create wallet for test user
    await db.insert(wallets).values([
      {
        userId: testUser.id,
        balance: '1000.00',
        currency: 'CREDITS',
      },
    ]);

    console.log('Seed completed successfully!');
    console.log('Test user: test@example.com / password123');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed().then(() => {
  console.log('Done!');
  process.exit(0);
});
