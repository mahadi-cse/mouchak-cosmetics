# Database Migration - Deployment Checklist

**Migration ID:** 20260407_add_product_analytics_stock_transfers  
**Date:** April 7, 2026  
**Status:** Ready for Deployment

---

## Pre-Migration Verification

### Environment Setup
- [ ] Database backup created
  ```bash
  pg_dump -U postgres mouchak_cosmetics > backups/backup_20260407_before_migration.sql
  ```
- [ ] Backup verified and stored
- [ ] Connection string confirmed
- [ ] Database credentials verified
- [ ] PostgreSQL version 12+ confirmed
- [ ] Prisma version 4.0+ confirmed

### Code Readiness
- [ ] Prisma schema.prisma updated ✅
- [ ] Migration SQL file created ✅
- [ ] Seed script created ✅
- [ ] All related code compiled
- [ ] No TypeScript errors
  ```bash
  cd server && npm run build
  ```
- [ ] Environment variables configured
  ```bash
  # .env.local or .env
  DATABASE_URL=postgresql://user:password@host:5432/mouchak_cosmetics
  ```

### Testing
- [ ] Unit tests pass
  ```bash
  npm run test
  ```
- [ ] Database tests pass
  ```bash
  npm run test:db
  ```
- [ ] Integration tests pass
  ```bash
  npm run test:integration
  ```
- [ ] Schema validation passes
  ```bash
  npx prisma validate
  ```

---

## Pre-Production Deployment Checklist

### Staging Environment
- [ ] Deploy to staging environment first
- [ ] Run migration on staging database
- [ ] Verify all tables created
- [ ] Verify all indexes created
- [ ] Verify all relationships working
- [ ] Seed data populated correctly
- [ ] Performance tests passed
- [ ] Load testing completed (100+ concurrent users)

### Notification
- [ ] Team notified of maintenance window
- [ ] Stakeholders informed
- [ ] Support team briefed
- [ ] Database team on standby

### Backup & Rollback
- [ ] Database backup verified (size, integrity)
- [ ] Rollback procedure documented
- [ ] Rollback script prepared
- [ ] Estimated downtime documented
- [ ] Estimated completion time: 5-10 minutes

---

## Migration Execution

### Pre-Migration (T-0)

**Stop Application Services**
```bash
# Stop API server
pm2 stop api

# Stop any background jobs
pm2 stop workers

# Verify all connections closed
ps aux | grep node
```

- [ ] API server stopped
- [ ] All Node processes stopped
- [ ] No pending database connections
  ```sql
  SELECT * FROM pg_stat_activity WHERE state = 'active';
  ```

### Migration (T+0)

**Step 1: Run Prisma Migration**
```bash
cd server

# Verify migration files
npx prisma migrate status

# Deploy migration
npx prisma migrate deploy

# Expected output:
# ✔ Applied migrations:
#   • 20260407_add_product_analytics_stock_transfers
```

- [ ] Migration completed without errors
- [ ] All SQL executed successfully
- [ ] 0 migration failures

**Step 2: Verify Tables**
```sql
-- Connect to database
psql -U postgres -d mouchak_cosmetics

-- Check new tables
\dt product_analytics stock_transfers

-- Check new enums
SELECT * FROM pg_enum WHERE enumtypid::text LIKE '%CustomerSegment%';
SELECT * FROM pg_enum WHERE enumtypid::text LIKE '%StockTransferStatus%';

-- Count tables
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
-- Expected: 13 tables
```

- [ ] product_analytics table exists
- [ ] stock_transfers table exists
- [ ] All indexes created (25+ new indexes)
- [ ] Foreign keys properly configured
- [ ] Enums registered

**Step 3: Generate Prisma Client**
```bash
npx prisma generate

# Expected output:
# ✔ Generated Prisma Client
```

- [ ] Prisma client regenerated
- [ ] Node modules updated
- [ ] Type definitions generated

**Step 4: Run Seed Script**
```bash
npx tsx prisma/seed-dashboard.ts

# Expected output:
# ✨ Database seed completed successfully!
```

- [ ] Product analytics populated
- [ ] Customer segments calculated
- [ ] Inventory reorder points initialized
- [ ] Seed completed successfully

**Step 5: Data Validation**
```sql
-- Verify product_analytics
SELECT COUNT(*) FROM product_analytics;
-- Should match number of products

-- Verify customer segments
SELECT segment, COUNT(*) FROM customers GROUP BY segment;

-- Verify stock_transfers (should be empty initially)
SELECT COUNT(*) FROM stock_transfers;

-- Check for data consistency
SELECT COUNT(*) FROM product_analytics 
WHERE product_id NOT IN (SELECT id FROM products);
-- Should be 0
```

- [ ] product_analytics records created
- [ ] Customer segments assigned
- [ ] No orphaned records
- [ ] All constraints satisfied

**Step 6: Performance Check**
```sql
-- Analyze tables
ANALYZE;

-- Check query performance
EXPLAIN ANALYZE 
SELECT * FROM product_analytics 
ORDER BY total_revenue DESC LIMIT 10;

-- Check index usage
SELECT * FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC LIMIT 10;
```

- [ ] Query plans optimal
- [ ] Indexes being used
- [ ] Performance acceptable
- [ ] No slow queries detected

**Step 7: Restart Services**
```bash
# Generate updated Prisma client
npx prisma generate

# Start API server
pm2 start api

# Start workers
pm2 start workers

# Verify running
pm2 status
```

- [ ] API server started
- [ ] All services running
- [ ] No startup errors

### Post-Migration (T+30min)

**Health Checks**
```bash
# Test API connectivity
curl http://localhost:5000/health

# Test database connection
npm run test:db

# Check logs for errors
pm2 logs api --lines 50

# Monitor performance
watch 'ps aux | grep node'
```

- [ ] API responding
- [ ] Database queries working
- [ ] No error logs
- [ ] Performance normal

**Functional Testing**
- [ ] Login working
- [ ] Product list loading
- [ ] Orders loading
- [ ] Inventory visible
- [ ] Dashboard metrics calculating
- [ ] No JavaScript errors

**Database Monitoring**
```sql
-- Check active connections
SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active';

-- Check table sizes
SELECT tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check slow queries
SELECT query, mean_exec_time, max_exec_time 
FROM pg_stat_statements 
WHERE mean_exec_time > 10 
ORDER BY mean_exec_time DESC LIMIT 10;
```

- [ ] Connection pool healthy
- [ ] Table sizes reasonable
- [ ] No query performance issues
- [ ] No blocking locks

---

## Issue Resolution

### If Migration Fails

**Immediate Actions**
1. [ ] Stop all application services
2. [ ] Note error message
3. [ ] Check PostgreSQL logs
4. [ ] Restore from backup
   ```bash
   psql -U postgres mouchak_cosmetics < backups/backup_20260407_before_migration.sql
   ```
5. [ ] Verify backup restoration
6. [ ] Document failure reason

**Troubleshooting**

**Error: "Column already exists"**
```bash
# Check if migration already ran
npx prisma migrate status

# If already applied, skip or resolve status
npx prisma migrate resolve --rolled-back 20260407_add_product_analytics_stock_transfers
```

**Error: "Type already exists"**
```sql
-- List existing enums
SELECT typname FROM pg_type WHERE typtype = 'e';

-- Drop if needed (careful!)
DROP TYPE IF EXISTS "CustomerSegment" CASCADE;
```

**Error: "Cannot create index"**
```sql
-- Check for duplicate index names
SELECT indexname FROM pg_indexes 
WHERE indexname LIKE 'product_analytics%';

-- Check for NULL values that violate constraints
SELECT COUNT(*) FROM product_analytics WHERE "productId" IS NULL;
```

**Error: "Foreign key constraint fails"**
```sql
-- Check referenced table exists
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_name = 'products';

-- Check for orphaned records
SELECT COUNT(*) FROM stock_transfers 
WHERE product_id NOT IN (SELECT id FROM products);
```

---

## Rollback Procedure

If critical issues occur:

### Quick Rollback (Last Resort)
```bash
# Restore database from backup
psql -U postgres mouchak_cosmetics < backups/backup_20260407_before_migration.sql

# Reset Prisma
npx prisma db push --force-reset

# Restart services
pm2 restart all
```

- [ ] Database restored
- [ ] Services restarted
- [ ] Functionality verified

### Graceful Rollback
```bash
# Rollback migration
npx prisma migrate resolve --rolled-back 20260407_add_product_analytics_stock_transfers

# Verify rolled back
npx prisma migrate status

# Regenerate client
npx prisma generate

# Restart services
pm2 restart all
```

- [ ] Migration rolled back
- [ ] Client regenerated
- [ ] Services running

---

## Post-Deployment Verification

### 24-Hour Monitoring
```bash
# Check error logs
tail -f /var/log/application/error.log

# Monitor database metrics
watch 'psql -U postgres mouchak_cosmetics -c "SELECT COUNT(*) FROM orders WHERE created_at > NOW() - INTERVAL '\''1 hour'\''"'

# Check system resources
watch 'free -h && df -h && top -b -n 1 | head -12'
```

- [ ] No errors in logs
- [ ] Database performing normally
- [ ] System resources normal
- [ ] All services healthy

### Performance Baseline

**Before Migration:**
- Average query time: ___ms
- Database size: ___GB
- Active connections: ___

**After Migration:**
- Average query time: ___ms
- Database size: ___GB
- Active connections: ___

- [ ] Performance metrics acceptable
- [ ] No degradation detected

### User Testing
- [ ] All dashboard modules accessible
- [ ] Product list loading correctly
- [ ] Orders page working
- [ ] Inventory tracking working
- [ ] Analytics calculating correctly
- [ ] No data loss observed
- [ ] No user-facing errors

---

## Sign-Off

### Technical Lead
- [ ] Migration verified successful
- [ ] All checks completed
- [ ] Performance acceptable
- **Name:** _________________ **Date:** _______

### Database Administrator
- [ ] Database integrity confirmed
- [ ] Backups verified
- [ ] Monitoring enabled
- **Name:** _________________ **Date:** _______

### Project Manager
- [ ] Deployment complete
- [ ] Stakeholders notified
- [ ] No critical issues
- **Name:** _________________ **Date:** _______

---

## Documentation & Archival

### Migration Documentation
- [ ] Migration summary created
- [ ] Issues and resolutions documented
- [ ] Performance metrics recorded
- [ ] Archive created: `migrations/20260407_archive/`

### Deployment Report
- [ ] Report written
- [ ] Issues documented
- [ ] Lessons learned noted
- [ ] Stored in: `docs/migrations/20260407_REPORT.md`

### Monitoring Configuration
- [ ] Alerts configured
- [ ] Dashboards created
- [ ] Metrics exported
- [ ] Slack/email notifications set up

---

## Final Notes

**Migration Duration:** 5-10 minutes  
**Expected Downtime:** 2-5 minutes  
**Data Integrity Risk:** Low ✅  
**Rollback Difficulty:** Low ✅  

**Success Indicators:**
- ✅ All 2 new tables created
- ✅ All 3 tables enhanced
- ✅ All 25+ indexes created  
- ✅ All 2 new enums registered
- ✅ Seed data populated
- ✅ Performance acceptable
- ✅ All tests passing
- ✅ No user impact

---

## Support Contacts

**During Migration:**
- Database: _________________ Ph: _______
- DevOps: _________________ Ph: _______
- Tech Lead: _________________ Ph: _______

**For Issues:**
1. Check this checklist
2. Review DB_MIGRATION_GUIDE.md
3. Contact database team
4. Escalate if needed

---

**Deployment Status:** ✅ Ready  
**Approval:** _________________ Date: _______  
**Executed:** _________________ Date: _______  

