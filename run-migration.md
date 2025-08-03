# Database Migration Instructions

## Fix Database Schema Issues

There are two main database schema issues that need to be fixed:

1. **Carbon Footprint Error**: "column user_settings.carbon_goal_kg does not exist"
2. **Station Column Error**: "Could not find the 'station' column of 'fuel_records' in the schema cache"

### Solution

1. **Open your Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor

2. **Run the Migration Scripts**
   - **First**: Copy and paste the contents of `add-carbon-footprint-columns.sql` into the SQL Editor
   - Click "Run" to execute the migration
   - **Second**: Copy and paste the contents of `add-station-column.sql` into the SQL Editor
   - Click "Run" to execute the migration

3. **Verify the Changes**
   - **First script** will add the following columns to the `user_settings` table:
     - `carbon_goal_kg` (DECIMAL, default: 1000.00) - Carbon footprint goal
     - `display_name` (TEXT) - User's display name
     - `vehicle_type` (TEXT, default: 'car') - Type of vehicle
     - `fuel_efficiency_km_l` (DECIMAL, default: 10.00) - Fuel efficiency
     - `carbon_intensity_kg_co2_l` (DECIMAL, default: 2.31) - CO2 emission factor
     - `monthly_budget` (DECIMAL, default: 500000.00) - Monthly fuel budget
     - `fuel_capacity` (DECIMAL, default: 50.00) - Fuel tank capacity
     - `last_service_date` (DATE) - Last vehicle service date
     - `service_interval_days` (INTEGER, default: 90) - Service interval
   
   - **Second script** will add the following column to the `fuel_records` table:
     - `station` (TEXT) - Fuel station name

4. **Check the Results**
   - The script will show you the updated table structure
   - It will also display sample data to confirm the changes

### What This Fixes

- ✅ Carbon Footprint component will load without errors
- ✅ Budget Tracker component will work properly
- ✅ Smart Reminders component will function correctly
- ✅ Fuel record creation and editing will work properly
- ✅ Station tracking in fuel records
- ✅ Statistics page will show most used stations
- ✅ Users can set carbon goals for environmental tracking
- ✅ Monthly budget tracking and alerts
- ✅ Vehicle service reminders
- ✅ Fuel capacity and low fuel warnings
- ✅ Vehicle type and efficiency settings are available
- ✅ Display name support for personalized experience

### Default Values

The migration sets sensible defaults:
- Carbon goal: 1000 kg CO2/year
- Vehicle type: 'car'
- Fuel efficiency: 10 km/L
- Carbon intensity: 2.31 kg CO2/L (gasoline)
- Monthly budget: Rp 500,000
- Fuel capacity: 50 liters
- Service interval: 90 days

After running this migration, the CarbonFootprint component should work correctly and display environmental impact data based on your fuel consumption. 