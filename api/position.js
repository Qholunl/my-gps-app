// api/position.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const { deviceId, deviceName, latitude, longitude, speed, altitude, course, satellites } = req.body;
        
        if (!deviceId || !latitude || !longitude) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Initialize Supabase
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Save position
        const { error: positionError } = await supabase
            .from('positions')
            .insert([{
                device_id: deviceId,
                latitude: latitude,
                longitude: longitude,
                speed: speed || 0,
                altitude: altitude || 0,
                course: course || 0,
                satellites: satellites || 0,
                timestamp: new Date().toISOString()
            }]);
        
        if (positionError) throw positionError;
        
        // Check if device exists
        const { data: existingDevice } = await supabase
            .from('devices')
            .select('*')
            .eq('device_id', deviceId)
            .single();
        
        if (!existingDevice) {
            await supabase
                .from('devices')
                .insert([{
                    device_id: deviceId,
                    device_name: deviceName || deviceId,
                    user_id: 1,
                    is_custom: true,
                    created_at: new Date().toISOString()
                }]);
        }
        
        return res.status(200).json({ success: true, message: 'Position saved' });
        
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: error.message });
    }
}