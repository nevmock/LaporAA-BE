const mongoose = require('mongoose');

class MigrationManager {
    constructor() {
        this.migrations = [];
        this.migrationCollection = 'migrations';
    }

    // Register a migration
    addMigration(version, description, up, down = null) {
        this.migrations.push({
            version,
            description,
            up,
            down,
            createdAt: new Date()
        });
    }

    // Check if migration has been executed
    async hasMigrationRun(version) {
        try {
            const migration = await mongoose.connection.db
                .collection(this.migrationCollection)
                .findOne({ version });
            return !!migration;
        } catch (error) {
            console.log('⚠️ Migration collection not found, creating...');
            return false;
        }
    }

    // Mark migration as executed
    async markMigrationAsRun(version, description) {
        await mongoose.connection.db
            .collection(this.migrationCollection)
            .insertOne({
                version,
                description,
                executedAt: new Date(),
                status: 'completed'
            });
    }

    // Run all pending migrations
    async runMigrations() {
        console.log('🔄 Checking for pending migrations...');
        
        let pendingCount = 0;
        
        for (const migration of this.migrations) {
            const hasRun = await this.hasMigrationRun(migration.version);
            
            if (!hasRun) {
                console.log(`📋 Running migration ${migration.version}: ${migration.description}`);
                
                try {
                    await migration.up();
                    await this.markMigrationAsRun(migration.version, migration.description);
                    console.log(`✅ Migration ${migration.version} completed successfully`);
                    pendingCount++;
                } catch (error) {
                    console.error(`❌ Migration ${migration.version} failed:`, error);
                    throw error;
                }
            }
        }
        
        if (pendingCount === 0) {
            console.log('✅ No pending migrations found - database is up to date');
        } else {
            console.log(`🎉 Successfully executed ${pendingCount} migration(s)`);
        }
    }

    // Get migration status
    async getMigrationStatus() {
        const executedMigrations = await mongoose.connection.db
            .collection(this.migrationCollection)
            .find({})
            .toArray();
        
        return {
            total: this.migrations.length,
            executed: executedMigrations.length,
            pending: this.migrations.length - executedMigrations.length,
            executedMigrations: executedMigrations.map(m => ({
                version: m.version,
                description: m.description,
                executedAt: m.executedAt
            }))
        };
    }
}

module.exports = MigrationManager;
