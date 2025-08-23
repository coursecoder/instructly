# Authentication Security Monitoring Runbook

## Overview

This runbook provides procedures for monitoring, detecting, and responding to authentication security incidents in the Instructly platform.

## Monitoring Dashboard

### Key Metrics to Track

#### Authentication Health
- **Login Success Rate**: Should be > 95%
- **Average Login Time**: Should be < 200ms
- **Session Duration**: Track average and identify anomalies
- **Token Validation Failures**: Should be < 1% of total requests

#### Security Metrics
- **Failed Login Attempts**: Track per IP and per email
- **Rate Limit Triggers**: Monitor frequency and patterns
- **Brute Force Attempts**: Track blocked IPs and attempts
- **Unusual Login Patterns**: Geographic, time-based, device-based

## Alert Thresholds

### Critical Alerts (Immediate Response)

#### 1. High Failed Login Rate
**Trigger**: > 50 failed logins in 5 minutes
**Severity**: High
**Response Time**: Immediate (< 5 minutes)

```bash
# Investigation Commands
grep "login_failure" /var/log/auth.log | tail -100
# Check for IP patterns
grep "login_failure" /var/log/auth.log | grep -o '"ip_address":"[^"]*"' | sort | uniq -c | sort -nr
```

#### 2. Brute Force Attack Detected
**Trigger**: > 20 IPs blocked for brute force in 10 minutes
**Severity**: Critical
**Response Time**: Immediate (< 2 minutes)

```bash
# Block additional suspicious IPs at firewall level
iptables -A INPUT -s SUSPICIOUS_IP -j DROP
# Review current blocks
grep "brute_force_attempt" /var/log/auth.log | grep "blocked.*true"
```

#### 3. Authentication Service Down
**Trigger**: Health check failures > 2 minutes
**Severity**: Critical
**Response Time**: Immediate (< 1 minute)

```bash
# Check service status
systemctl status instructly-api
# Check recent logs
journalctl -u instructly-api -n 50
# Check environment validation
curl http://localhost:3001/health
```

### Warning Alerts (Monitor Closely)

#### 1. Elevated Failed Logins
**Trigger**: > 20 failed logins in 15 minutes
**Severity**: Medium
**Response Time**: 15 minutes

#### 2. Rate Limiting Active
**Trigger**: > 10 rate limit triggers in 1 hour
**Severity**: Medium
**Response Time**: 30 minutes

#### 3. Token Validation Failures
**Trigger**: > 5% token validation failure rate
**Severity**: Medium
**Response Time**: 15 minutes

## Incident Response Procedures

### 1. Suspected Brute Force Attack

#### Immediate Actions (0-5 minutes)
1. **Identify Attack Pattern**
   ```bash
   # Get top attacking IPs
   grep "brute_force_attempt" /var/log/auth.log | \
   grep -o '"ip_address":"[^"]*"' | sort | uniq -c | sort -nr | head -10
   ```

2. **Block Attacking IPs**
   ```bash
   # Temporarily block at application level (already automated)
   # For persistent attacks, block at firewall
   for ip in $(attacking_ips); do
     iptables -A INPUT -s $ip -j DROP
   done
   ```

3. **Notify Team**
   ```bash
   # Send alert to security team
   echo "SECURITY ALERT: Brute force attack detected. Details in logs." | \
   mail -s "URGENT: Authentication Attack" security-team@instructly.app
   ```

#### Investigation (5-30 minutes)
1. **Analyze Attack Patterns**
   - Geographic distribution of attacks
   - Targeted user accounts
   - Attack timing and frequency
   - User agents and other fingerprints

2. **Check for Compromise**
   ```bash
   # Look for successful logins from attacking IPs
   grep "login_success" /var/log/auth.log | grep -E "(ip1|ip2|ip3)"
   ```

3. **Assess Impact**
   - Any successful breaches
   - Affected user accounts
   - Service availability impact

#### Response Actions (30+ minutes)
1. **Enhanced Monitoring**
   - Reduce rate limit thresholds temporarily
   - Enable additional logging
   - Monitor for attack evolution

2. **User Communication**
   - Notify affected users if accounts compromised
   - Recommend password changes if needed
   - Update security advisory

### 2. Authentication Service Failure

#### Immediate Actions (0-2 minutes)
1. **Check Service Health**
   ```bash
   # Service status
   systemctl status instructly-api
   # Check if process is running
   ps aux | grep instructly
   # Check port binding
   netstat -tlnp | grep :3001
   ```

2. **Quick Restart Attempt**
   ```bash
   # Only if service is clearly down
   systemctl restart instructly-api
   # Wait 30 seconds and check
   sleep 30 && curl http://localhost:3001/health
   ```

#### Investigation (2-10 minutes)
1. **Analyze Logs**
   ```bash
   # Recent error logs
   journalctl -u instructly-api -n 100 --no-pager
   # Check for environment issues
   grep -i "environment" /var/log/instructly/error.log
   ```

2. **Check Dependencies**
   ```bash
   # Supabase connectivity
   curl -H "apikey: $SUPABASE_ANON_KEY" "$SUPABASE_URL/rest/v1/"
   # OpenAI connectivity  
   curl -H "Authorization: Bearer $OPENAI_API_KEY" \
        "https://api.openai.com/v1/models"
   ```

3. **Resource Check**
   ```bash
   # Memory and CPU usage
   free -h && top -n 1 -b
   # Disk space
   df -h
   ```

### 3. Unusual Login Patterns

#### Investigation Steps
1. **Pattern Analysis**
   ```bash
   # Login times by hour
   grep "login_success" /var/log/auth.log | \
   awk -F'"' '{print $8}' | cut -c12-13 | sort | uniq -c
   
   # Geographic analysis (if IP geolocation available)
   grep "login_success" /var/log/auth.log | \
   grep -o '"ip_address":"[^"]*"' | sort | uniq -c
   ```

2. **User Account Review**
   ```bash
   # Check specific user's recent activity
   grep "user_123" /var/log/auth.log | tail -20
   ```

3. **Device/Browser Analysis**
   ```bash
   # User agent patterns
   grep "login_success" /var/log/auth.log | \
   grep -o '"user_agent":"[^"]*"' | sort | uniq -c | sort -nr
   ```

## Recovery Procedures

### 1. Account Compromise Response

#### Immediate Actions
1. **Lock Affected Accounts**
   ```bash
   # Disable user account in Supabase
   # Force logout all sessions for user
   ```

2. **Invalidate Sessions**
   ```bash
   # Revoke all tokens for compromised user
   # Clear session records
   ```

3. **Reset Credentials**
   ```bash
   # Force password reset
   # Generate new API tokens if applicable
   ```

### 2. Service Recovery

#### After Authentication Service Outage
1. **Verify Service Health**
   ```bash
   # Full health check
   curl http://localhost:3001/health
   # Test authentication flow
   curl -X POST http://localhost:3001/trpc/auth.login
   ```

2. **Monitor for Issues**
   ```bash
   # Watch logs for errors
   tail -f /var/log/instructly/auth.log
   # Monitor authentication metrics
   ```

3. **Gradual Traffic Restoration**
   - Monitor error rates during recovery
   - Be ready to implement emergency measures

## Escalation Procedures

### Level 1: On-Call Engineer
- Authentication service failures
- Minor rate limiting issues
- Single account compromises

### Level 2: Security Team Lead
- Suspected data breaches
- Multi-account compromises
- Persistent attacks
- Service unavailability > 30 minutes

### Level 3: Engineering Manager + Security Director
- Confirmed data breaches
- System-wide security failures
- Critical infrastructure compromise
- Service unavailability > 2 hours

### Emergency Contacts
- **On-Call Engineer**: [phone/pager]
- **Security Team Lead**: [phone/email]
- **Engineering Manager**: [phone/email]
- **Security Director**: [phone/email]

## Post-Incident Procedures

### 1. Immediate Post-Incident (< 2 hours)
- Document timeline of events
- Collect all relevant logs
- Notify stakeholders of resolution
- Implement temporary additional monitoring

### 2. Short-term Follow-up (< 24 hours)
- Detailed incident analysis
- Identify root cause
- Document lessons learned
- Update monitoring thresholds if needed

### 3. Long-term Improvements (< 1 week)
- Implement preventive measures
- Update security policies
- Enhance monitoring capabilities
- Conduct security training if needed

## Log Analysis Examples

### Finding Patterns in Authentication Logs

```bash
# Most common failed login reasons
grep "login_failure" /var/log/auth.log | \
jq -r '.additional_data.reason' | sort | uniq -c | sort -nr

# Peak attack times
grep "brute_force_attempt" /var/log/auth.log | \
awk -F'"' '{print $8}' | cut -c1-13 | sort | uniq -c | sort -nr

# Successful logins after failed attempts (potential compromises)
grep -A5 -B5 "login_failure.*user@example.com" /var/log/auth.log | \
grep "login_success.*user@example.com"
```

### Performance Analysis

```bash
# Average authentication response times
grep "authentication_timing" /var/log/auth.log | \
jq '.response_time_ms' | awk '{sum+=$1; n++} END {print "Average:", sum/n "ms"}'

# Rate limiting effectiveness
grep "rate_limit_exceeded" /var/log/auth.log | \
awk -F'"' '{print $8}' | cut -c1-13 | sort | uniq -c
```

## Security Metrics Dashboard

### Daily Reports
- Authentication success rate
- Failed login attempt summary
- Rate limiting activity
- Geographic login distribution
- New user registrations

### Weekly Reports
- Security incident summary
- Trend analysis
- Performance metrics
- Capacity planning data

### Monthly Reports
- Security posture assessment
- Incident trend analysis
- Infrastructure health review
- Compliance audit data

## Compliance and Audit

### Required Log Retention
- Authentication logs: 1 year
- Security incident logs: 3 years
- Access logs: 90 days
- Performance logs: 30 days

### Audit Trail Requirements
- All authentication events
- Administrative actions
- Configuration changes
- Security incidents

### Regular Security Reviews
- Monthly security metrics review
- Quarterly penetration testing
- Annual security audit
- Continuous vulnerability assessment