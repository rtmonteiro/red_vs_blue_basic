#!/usr/bin/env node

/**
 * Environment Comparison Tool
 * Shows differences between development and production configurations
 */

const fs = require('fs')
const path = require('path')

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {}
  }
  
  const content = fs.readFileSync(filePath, 'utf8')
  const lines = content.split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
  
  const vars = {}
  lines.forEach(line => {
    if (line.includes('=')) {
      const [key, ...valueParts] = line.split('=')
      const value = valueParts.join('=')
      if (key && value !== undefined) {
        vars[key.trim()] = value.trim()
      }
    }
  })
  
  return vars
}

function compareEnvironments() {
  const envDir = path.resolve(__dirname, '..')
  const devFile = path.join(envDir, '.env.development')
  const prodFile = path.join(envDir, '.env.production')
  
  const devVars = parseEnvFile(devFile)
  const prodVars = parseEnvFile(prodFile)
  
  console.log('🔍 Environment Configuration Comparison')
  console.log('═'.repeat(60))
  
  // Get all unique variables
  const allVars = new Set([...Object.keys(devVars), ...Object.keys(prodVars)])
  
  console.log('| Variable | Development | Production |')
  console.log('|----------|-------------|------------|')
  
  for (const varName of Array.from(allVars).sort()) {
    const devValue = devVars[varName] || '❌ Missing'
    const prodValue = prodVars[varName] || '❌ Missing'
    
    // Mask sensitive information
    const maskSensitive = (key, value) => {
      if (key.includes('PASSWORD') || key.includes('SECRET')) {
        return value === '❌ Missing' ? value : '***'
      }
      return value
    }
    
    const devDisplay = maskSensitive(varName, devValue)
    const prodDisplay = maskSensitive(varName, prodValue)
    
    console.log(`| ${varName} | ${devDisplay} | ${prodDisplay} |`)
  }
  
  console.log('')
  console.log('🎯 Key Differences:')
  
  // Highlight key differences
  const differences = []
  
  if (devVars.DB_HOST !== prodVars.DB_HOST) {
    differences.push(`📍 Database Host: ${devVars.DB_HOST} → ${prodVars.DB_HOST}`)
  }
  
  if (devVars.DB_NAME !== prodVars.DB_NAME) {
    differences.push(`🗄️  Database Name: ${devVars.DB_NAME} → ${prodVars.DB_NAME}`)
  }
  
  if (devVars.NODE_ENV !== prodVars.NODE_ENV) {
    differences.push(`🏷️  Environment: ${devVars.NODE_ENV} → ${prodVars.NODE_ENV}`)
  }
  
  if (differences.length === 0) {
    console.log('   No major differences found')
  } else {
    differences.forEach(diff => console.log(`   ${diff}`))
  }
  
  console.log('')
  console.log('💡 Usage:')
  console.log('   Development: npm run env:use:dev')
  console.log('   Production:  npm run env:use:prod')
}

if (require.main === module) {
  compareEnvironments()
}

module.exports = { compareEnvironments }
