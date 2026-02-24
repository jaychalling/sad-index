export interface Database {
  public: {
    Tables: {
      bsi_weekly: {
        Row: {
          id: number
          week_date: string
          bsi_score: number
          avg_valence: number | null
          track_count: number
          most_sad_track: TrackJson | null
          most_happy_track: TrackJson | null
          created_at: string
          updated_at: string
        }
        Insert: {
          week_date: string
          bsi_score: number
          avg_valence?: number | null
          track_count?: number
          most_sad_track?: TrackJson | null
          most_happy_track?: TrackJson | null
        }
        Update: Partial<Database['public']['Tables']['bsi_weekly']['Insert']>
      }
      track_weekly: {
        Row: {
          id: number
          week_date: string
          rank: number
          title: string
          artist: string
          valence: number | null
          spotify_id: string | null
        }
        Insert: {
          week_date: string
          rank: number
          title: string
          artist: string
          valence?: number | null
          spotify_id?: string | null
        }
        Update: Partial<Database['public']['Tables']['track_weekly']['Insert']>
      }
      economic_data: {
        Row: {
          id: number
          date: string
          indicator: string
          value: number | null
          created_at: string
        }
        Insert: {
          date: string
          indicator: string
          value?: number | null
        }
        Update: Partial<Database['public']['Tables']['economic_data']['Insert']>
      }
      subscribers: {
        Row: {
          id: number
          email: string
          tier: string
          subscribed_at: string
          unsubscribed: boolean
        }
        Insert: {
          email: string
          tier?: string
          unsubscribed?: boolean
        }
        Update: Partial<Database['public']['Tables']['subscribers']['Insert']>
      }
      api_keys: {
        Row: {
          id: number
          key: string
          email: string
          tier: string
          daily_limit: number
          created_at: string
        }
        Insert: {
          key: string
          email: string
          tier?: string
          daily_limit?: number
        }
        Update: Partial<Database['public']['Tables']['api_keys']['Insert']>
      }
      valence_cache: {
        Row: {
          id: number
          spotify_id: string | null
          title: string
          artist: string
          valence: number
          source: string
          analyzed_at: string
        }
        Insert: {
          title: string
          artist: string
          valence: number
          spotify_id?: string | null
          source?: string
        }
        Update: Partial<Database['public']['Tables']['valence_cache']['Insert']>
      }
    }
  }
}

export interface TrackJson {
  title: string
  artist: string
  valence: number
  rank: number
}
