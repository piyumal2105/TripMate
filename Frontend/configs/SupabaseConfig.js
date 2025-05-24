// configs/SupabaseConfig.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pxnldxbshoiopuqoiomd.supabase.co'; // Replace with your Project URL
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4bmxkeGJzaG9pb3B1cW9pb21kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwNzEzOTAsImV4cCI6MjA2MzY0NzM5MH0.Y0jKYVBSyunO5TaaMS6qeBRYOO988Oz_Z2LOVaEqIUU'; // Replace with your Anon Public Key

export const supabase = createClient(supabaseUrl, supabaseAnonKey);