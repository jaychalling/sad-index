// Billboard Sadness Index - Seed Data
// BSI = weighted average of (1 - valence) across Hot 100 tracks
// Low BSI = bright/happy charts, High BSI = sad/melancholic charts
// Key insight: recessions trigger ESCAPIST pop (low BSI), genuine crises spike BSI briefly

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BsiDataPoint {
  date: string; // YYYY-MM-DD
  bsi: number; // 0-100
  avgValence: number; // 0-1, where BSI ≈ (1 - avgValence) * 100
}

export interface Sp500DataPoint {
  date: string;
  value: number;
}

export interface Track {
  rank: number;
  title: string;
  artist: string;
  valence: number; // 0-1
}

export interface EconomicIndicators {
  sp500: { value: number; change: number };
  vix: { value: number; change: number };
  unemployment: { value: number; change: number };
  consumerSentiment: { value: number; change: number };
}

export interface CurrentWeek {
  weekDate: string;
  bsi: number;
  prevBsi: number;
  weeklyChange: number;
  avgValence: number;
  trackCount: number;
  mostSadTrack: { title: string; artist: string; valence: number; rank: number };
  mostHappyTrack: { title: string; artist: string; valence: number; rank: number };
  economicIndicators: EconomicIndicators;
}

export interface HistoricalEvent {
  date: string;
  label: string;
  bsi?: number; // populated dynamically from DB
}

// ─── Weekly BSI Data (monthly samples, 2000-01 to 2026-02) ──────────────────

export const bsiWeeklyData: BsiDataPoint[] = [
  // 2000: Dot-com peak → burst begins. Charts: Destiny's Child, *NSYNC, Santana
  // Pop-TRL era, fairly bright but some ballads. BSI 40-50 range.
  { date: '2000-01-01', bsi: 47, avgValence: 0.53 },
  { date: '2000-02-01', bsi: 45, avgValence: 0.55 },
  { date: '2000-03-01', bsi: 44, avgValence: 0.56 },
  { date: '2000-04-01', bsi: 43, avgValence: 0.57 },
  { date: '2000-05-01', bsi: 42, avgValence: 0.58 },
  { date: '2000-06-01', bsi: 40, avgValence: 0.60 },
  { date: '2000-07-01', bsi: 39, avgValence: 0.61 },
  { date: '2000-08-01', bsi: 41, avgValence: 0.59 },
  { date: '2000-09-01', bsi: 43, avgValence: 0.57 },
  { date: '2000-10-01', bsi: 44, avgValence: 0.56 },
  { date: '2000-11-01', bsi: 42, avgValence: 0.58 },
  { date: '2000-12-01', bsi: 40, avgValence: 0.60 },

  // 2001: 9/11 + recession. Charts go ESCAPIST. Ja Rule, Alicia Keys debut,
  // but massive shift to feel-good. Brief sadness spike in Sep then charts brighten hard.
  { date: '2001-01-01', bsi: 38, avgValence: 0.62 },
  { date: '2001-02-01', bsi: 37, avgValence: 0.63 },
  { date: '2001-03-01', bsi: 35, avgValence: 0.65 },
  { date: '2001-04-01', bsi: 33, avgValence: 0.67 },
  { date: '2001-05-01', bsi: 32, avgValence: 0.68 },
  { date: '2001-06-01', bsi: 31, avgValence: 0.69 },
  { date: '2001-07-01', bsi: 30, avgValence: 0.70 },
  { date: '2001-08-01', bsi: 29, avgValence: 0.71 },
  { date: '2001-09-01', bsi: 42, avgValence: 0.58 }, // 9/11 brief spike
  { date: '2001-10-01', bsi: 28, avgValence: 0.72 }, // Immediate escapism rebound
  { date: '2001-11-01', bsi: 26, avgValence: 0.74 },
  { date: '2001-12-01', bsi: 25, avgValence: 0.75 },

  // 2002: Deep dot-com bottom. Charts: Nelly "Hot in Herre", Eminem "Lose Yourself"
  // Escapism in full effect. BSI stays very low.
  { date: '2002-01-01', bsi: 27, avgValence: 0.73 },
  { date: '2002-02-01', bsi: 28, avgValence: 0.72 },
  { date: '2002-03-01', bsi: 26, avgValence: 0.74 },
  { date: '2002-04-01', bsi: 25, avgValence: 0.75 },
  { date: '2002-05-01', bsi: 27, avgValence: 0.73 },
  { date: '2002-06-01', bsi: 26, avgValence: 0.74 },
  { date: '2002-07-01', bsi: 24, avgValence: 0.76 },
  { date: '2002-08-01', bsi: 25, avgValence: 0.75 },
  { date: '2002-09-01', bsi: 28, avgValence: 0.72 },
  { date: '2002-10-01', bsi: 30, avgValence: 0.70 },
  { date: '2002-11-01', bsi: 29, avgValence: 0.71 },
  { date: '2002-12-01', bsi: 28, avgValence: 0.72 },

  // 2003: Iraq War begins. Recovery starts. OutKast "Hey Ya!", Beyonce solo debut.
  // Charts start normalizing upward.
  { date: '2003-01-01', bsi: 30, avgValence: 0.70 },
  { date: '2003-02-01', bsi: 32, avgValence: 0.68 },
  { date: '2003-03-01', bsi: 34, avgValence: 0.66 },
  { date: '2003-04-01', bsi: 35, avgValence: 0.65 },
  { date: '2003-05-01', bsi: 37, avgValence: 0.63 },
  { date: '2003-06-01', bsi: 38, avgValence: 0.62 },
  { date: '2003-07-01', bsi: 40, avgValence: 0.60 },
  { date: '2003-08-01', bsi: 42, avgValence: 0.58 },
  { date: '2003-09-01', bsi: 43, avgValence: 0.57 },
  { date: '2003-10-01', bsi: 41, avgValence: 0.59 },
  { date: '2003-11-01', bsi: 39, avgValence: 0.61 },
  { date: '2003-12-01', bsi: 38, avgValence: 0.62 },

  // 2004: Usher "Yeah!", Kanye debut. Economy improving. BSI normalizing 40-48.
  { date: '2004-01-01', bsi: 40, avgValence: 0.60 },
  { date: '2004-02-01', bsi: 42, avgValence: 0.58 },
  { date: '2004-03-01', bsi: 43, avgValence: 0.57 },
  { date: '2004-04-01', bsi: 44, avgValence: 0.56 },
  { date: '2004-05-01', bsi: 45, avgValence: 0.55 },
  { date: '2004-06-01', bsi: 43, avgValence: 0.57 },
  { date: '2004-07-01', bsi: 42, avgValence: 0.58 },
  { date: '2004-08-01', bsi: 44, avgValence: 0.56 },
  { date: '2004-09-01', bsi: 46, avgValence: 0.54 },
  { date: '2004-10-01', bsi: 47, avgValence: 0.53 },
  { date: '2004-11-01', bsi: 45, avgValence: 0.55 },
  { date: '2004-12-01', bsi: 44, avgValence: 0.56 },

  // 2005: Kanye "Gold Digger", Mariah comeback. Katrina in Aug. Mid-range BSI.
  { date: '2005-01-01', bsi: 46, avgValence: 0.54 },
  { date: '2005-02-01', bsi: 47, avgValence: 0.53 },
  { date: '2005-03-01', bsi: 48, avgValence: 0.52 },
  { date: '2005-04-01', bsi: 47, avgValence: 0.53 },
  { date: '2005-05-01', bsi: 46, avgValence: 0.54 },
  { date: '2005-06-01', bsi: 45, avgValence: 0.55 },
  { date: '2005-07-01', bsi: 44, avgValence: 0.56 },
  { date: '2005-08-01', bsi: 50, avgValence: 0.50 }, // Katrina
  { date: '2005-09-01', bsi: 48, avgValence: 0.52 },
  { date: '2005-10-01', bsi: 47, avgValence: 0.53 },
  { date: '2005-11-01', bsi: 46, avgValence: 0.54 },
  { date: '2005-12-01', bsi: 45, avgValence: 0.55 },

  // 2006: "Hips Don't Lie", "SexyBack", "Crazy" (Gnarls Barkley). Stable economy.
  { date: '2006-01-01', bsi: 47, avgValence: 0.53 },
  { date: '2006-02-01', bsi: 48, avgValence: 0.52 },
  { date: '2006-03-01', bsi: 49, avgValence: 0.51 },
  { date: '2006-04-01', bsi: 50, avgValence: 0.50 },
  { date: '2006-05-01', bsi: 48, avgValence: 0.52 },
  { date: '2006-06-01', bsi: 47, avgValence: 0.53 },
  { date: '2006-07-01', bsi: 46, avgValence: 0.54 },
  { date: '2006-08-01', bsi: 48, avgValence: 0.52 },
  { date: '2006-09-01', bsi: 50, avgValence: 0.50 },
  { date: '2006-10-01', bsi: 51, avgValence: 0.49 },
  { date: '2006-11-01', bsi: 49, avgValence: 0.51 },
  { date: '2006-12-01', bsi: 48, avgValence: 0.52 },

  // 2007: Rihanna "Umbrella", Soulja Boy, T-Pain era. Pre-crash optimism then cracks.
  { date: '2007-01-01', bsi: 49, avgValence: 0.51 },
  { date: '2007-02-01', bsi: 50, avgValence: 0.50 },
  { date: '2007-03-01', bsi: 51, avgValence: 0.49 },
  { date: '2007-04-01', bsi: 52, avgValence: 0.48 },
  { date: '2007-05-01', bsi: 50, avgValence: 0.50 },
  { date: '2007-06-01', bsi: 48, avgValence: 0.52 },
  { date: '2007-07-01', bsi: 47, avgValence: 0.53 },
  { date: '2007-08-01', bsi: 46, avgValence: 0.54 },
  { date: '2007-09-01', bsi: 44, avgValence: 0.56 },
  { date: '2007-10-01', bsi: 42, avgValence: 0.58 },
  { date: '2007-11-01', bsi: 40, avgValence: 0.60 },
  { date: '2007-12-01', bsi: 38, avgValence: 0.62 },

  // 2008: Financial crisis. Lehman Sep 15. Lady Gaga emerges. Charts go HYPER-bright.
  // "Just Dance", "Low" (Flo Rida), "Lollipop" (Lil Wayne). BSI plummets.
  { date: '2008-01-01', bsi: 35, avgValence: 0.65 },
  { date: '2008-02-01', bsi: 33, avgValence: 0.67 },
  { date: '2008-03-01', bsi: 30, avgValence: 0.70 }, // Bear Stearns collapse
  { date: '2008-04-01', bsi: 28, avgValence: 0.72 },
  { date: '2008-05-01', bsi: 27, avgValence: 0.73 },
  { date: '2008-06-01', bsi: 25, avgValence: 0.75 },
  { date: '2008-07-01', bsi: 24, avgValence: 0.76 },
  { date: '2008-08-01', bsi: 23, avgValence: 0.77 },
  { date: '2008-09-01', bsi: 22, avgValence: 0.78 }, // Lehman Brothers
  { date: '2008-10-01', bsi: 20, avgValence: 0.80 }, // Maximum escapism
  { date: '2008-11-01', bsi: 21, avgValence: 0.79 },
  { date: '2008-12-01', bsi: 22, avgValence: 0.78 },

  // 2009: Recession pop peak. BEP "I Gotta Feeling", "Boom Boom Pow",
  // Lady Gaga "Poker Face", Kesha "TiK ToK". BSI stays very low.
  { date: '2009-01-01', bsi: 23, avgValence: 0.77 },
  { date: '2009-02-01', bsi: 24, avgValence: 0.76 },
  { date: '2009-03-01', bsi: 22, avgValence: 0.78 }, // S&P 500 bottom (666)
  { date: '2009-04-01', bsi: 25, avgValence: 0.75 },
  { date: '2009-05-01', bsi: 26, avgValence: 0.74 },
  { date: '2009-06-01', bsi: 24, avgValence: 0.76 },
  { date: '2009-07-01', bsi: 25, avgValence: 0.75 },
  { date: '2009-08-01', bsi: 27, avgValence: 0.73 },
  { date: '2009-09-01', bsi: 28, avgValence: 0.72 },
  { date: '2009-10-01', bsi: 26, avgValence: 0.74 },
  { date: '2009-11-01', bsi: 25, avgValence: 0.75 },
  { date: '2009-12-01', bsi: 23, avgValence: 0.77 }, // TiK ToK era

  // 2010: Still recession-pop tail. "California Gurls", "OMG", "Dynamite".
  // BSI slowly climbs from low 20s toward 30s.
  { date: '2010-01-01', bsi: 25, avgValence: 0.75 },
  { date: '2010-02-01', bsi: 27, avgValence: 0.73 },
  { date: '2010-03-01', bsi: 28, avgValence: 0.72 },
  { date: '2010-04-01', bsi: 29, avgValence: 0.71 },
  { date: '2010-05-01', bsi: 30, avgValence: 0.70 },
  { date: '2010-06-01', bsi: 28, avgValence: 0.72 },
  { date: '2010-07-01', bsi: 27, avgValence: 0.73 },
  { date: '2010-08-01', bsi: 29, avgValence: 0.71 },
  { date: '2010-09-01', bsi: 31, avgValence: 0.69 },
  { date: '2010-10-01', bsi: 33, avgValence: 0.67 },
  { date: '2010-11-01', bsi: 32, avgValence: 0.68 },
  { date: '2010-12-01', bsi: 34, avgValence: 0.66 },

  // 2011: Adele "21" era — "Rolling in the Deep", "Someone Like You".
  // Charts get more emotional. LMFAO "Party Rock" balances. BSI climbs to 40s.
  { date: '2011-01-01', bsi: 35, avgValence: 0.65 },
  { date: '2011-02-01', bsi: 37, avgValence: 0.63 },
  { date: '2011-03-01', bsi: 39, avgValence: 0.61 },
  { date: '2011-04-01', bsi: 41, avgValence: 0.59 },
  { date: '2011-05-01', bsi: 40, avgValence: 0.60 },
  { date: '2011-06-01', bsi: 38, avgValence: 0.62 },
  { date: '2011-07-01', bsi: 37, avgValence: 0.63 },
  { date: '2011-08-01', bsi: 40, avgValence: 0.60 },
  { date: '2011-09-01', bsi: 43, avgValence: 0.57 },
  { date: '2011-10-01', bsi: 44, avgValence: 0.56 },
  { date: '2011-11-01', bsi: 42, avgValence: 0.58 },
  { date: '2011-12-01', bsi: 41, avgValence: 0.59 },

  // 2012: "Call Me Maybe", "Somebody That I Used to Know", "We Are Young".
  // Mix of bright and wistful. BSI 42-48.
  { date: '2012-01-01', bsi: 43, avgValence: 0.57 },
  { date: '2012-02-01', bsi: 44, avgValence: 0.56 },
  { date: '2012-03-01', bsi: 42, avgValence: 0.58 },
  { date: '2012-04-01', bsi: 43, avgValence: 0.57 },
  { date: '2012-05-01', bsi: 45, avgValence: 0.55 },
  { date: '2012-06-01', bsi: 44, avgValence: 0.56 },
  { date: '2012-07-01', bsi: 42, avgValence: 0.58 },
  { date: '2012-08-01', bsi: 46, avgValence: 0.54 },
  { date: '2012-09-01', bsi: 47, avgValence: 0.53 },
  { date: '2012-10-01', bsi: 48, avgValence: 0.52 },
  { date: '2012-11-01', bsi: 46, avgValence: 0.54 },
  { date: '2012-12-01', bsi: 44, avgValence: 0.56 },

  // 2013: "Blurred Lines", "Get Lucky", "Royals" (Lorde). EDM peak. BSI 43-50.
  { date: '2013-01-01', bsi: 45, avgValence: 0.55 },
  { date: '2013-02-01', bsi: 46, avgValence: 0.54 },
  { date: '2013-03-01', bsi: 44, avgValence: 0.56 },
  { date: '2013-04-01', bsi: 43, avgValence: 0.57 },
  { date: '2013-05-01', bsi: 42, avgValence: 0.58 },
  { date: '2013-06-01', bsi: 41, avgValence: 0.59 },
  { date: '2013-07-01', bsi: 43, avgValence: 0.57 },
  { date: '2013-08-01', bsi: 45, avgValence: 0.55 },
  { date: '2013-09-01', bsi: 47, avgValence: 0.53 },
  { date: '2013-10-01', bsi: 49, avgValence: 0.51 },
  { date: '2013-11-01', bsi: 50, avgValence: 0.50 },
  { date: '2013-12-01', bsi: 48, avgValence: 0.52 },

  // 2014: "Happy" (Pharrell), "Shake It Off", "All About That Bass". Very bright summer.
  // But also "Stay With Me" (Sam Smith). BSI 40-50.
  { date: '2014-01-01', bsi: 47, avgValence: 0.53 },
  { date: '2014-02-01', bsi: 46, avgValence: 0.54 },
  { date: '2014-03-01', bsi: 44, avgValence: 0.56 },
  { date: '2014-04-01', bsi: 42, avgValence: 0.58 },
  { date: '2014-05-01', bsi: 40, avgValence: 0.60 },
  { date: '2014-06-01', bsi: 39, avgValence: 0.61 },
  { date: '2014-07-01', bsi: 41, avgValence: 0.59 },
  { date: '2014-08-01', bsi: 43, avgValence: 0.57 },
  { date: '2014-09-01', bsi: 45, avgValence: 0.55 },
  { date: '2014-10-01', bsi: 47, avgValence: 0.53 },
  { date: '2014-11-01', bsi: 48, avgValence: 0.52 },
  { date: '2014-12-01', bsi: 46, avgValence: 0.54 },

  // 2015: Drake "Hotline Bling", Adele "Hello", The Weeknd "Can't Feel My Face".
  // More introspective/moody. BSI 45-53.
  { date: '2015-01-01', bsi: 47, avgValence: 0.53 },
  { date: '2015-02-01', bsi: 48, avgValence: 0.52 },
  { date: '2015-03-01', bsi: 49, avgValence: 0.51 },
  { date: '2015-04-01', bsi: 48, avgValence: 0.52 },
  { date: '2015-05-01', bsi: 46, avgValence: 0.54 },
  { date: '2015-06-01', bsi: 45, avgValence: 0.55 },
  { date: '2015-07-01', bsi: 47, avgValence: 0.53 },
  { date: '2015-08-01', bsi: 49, avgValence: 0.51 },
  { date: '2015-09-01', bsi: 50, avgValence: 0.50 },
  { date: '2015-10-01', bsi: 52, avgValence: 0.48 },
  { date: '2015-11-01', bsi: 53, avgValence: 0.47 }, // Adele "Hello" peak
  { date: '2015-12-01', bsi: 51, avgValence: 0.49 },

  // 2016: Drake "Views", Chainsmokers "Closer", Bieber "Love Yourself".
  // Tropical house + sad boy era. BSI 48-55.
  { date: '2016-01-01', bsi: 50, avgValence: 0.50 },
  { date: '2016-02-01', bsi: 49, avgValence: 0.51 },
  { date: '2016-03-01', bsi: 48, avgValence: 0.52 },
  { date: '2016-04-01', bsi: 50, avgValence: 0.50 },
  { date: '2016-05-01', bsi: 51, avgValence: 0.49 },
  { date: '2016-06-01', bsi: 49, avgValence: 0.51 },
  { date: '2016-07-01', bsi: 48, avgValence: 0.52 },
  { date: '2016-08-01', bsi: 50, avgValence: 0.50 },
  { date: '2016-09-01', bsi: 52, avgValence: 0.48 },
  { date: '2016-10-01', bsi: 53, avgValence: 0.47 },
  { date: '2016-11-01', bsi: 55, avgValence: 0.45 }, // Post-election mood
  { date: '2016-12-01', bsi: 52, avgValence: 0.48 },

  // 2017: "Despacito", "Shape of You", Kendrick "HUMBLE.". Mix of party + serious.
  // BSI 44-51.
  { date: '2017-01-01', bsi: 50, avgValence: 0.50 },
  { date: '2017-02-01', bsi: 49, avgValence: 0.51 },
  { date: '2017-03-01', bsi: 48, avgValence: 0.52 },
  { date: '2017-04-01', bsi: 47, avgValence: 0.53 },
  { date: '2017-05-01', bsi: 46, avgValence: 0.54 },
  { date: '2017-06-01', bsi: 45, avgValence: 0.55 },
  { date: '2017-07-01', bsi: 44, avgValence: 0.56 },
  { date: '2017-08-01', bsi: 46, avgValence: 0.54 },
  { date: '2017-09-01', bsi: 48, avgValence: 0.52 },
  { date: '2017-10-01', bsi: 50, avgValence: 0.50 },
  { date: '2017-11-01', bsi: 51, avgValence: 0.49 },
  { date: '2017-12-01', bsi: 49, avgValence: 0.51 },

  // 2018: Drake "God's Plan", "Nice For What"; Post Malone "Psycho", Juice WRLD.
  // Emo rap growing. BSI 46-54.
  { date: '2018-01-01', bsi: 49, avgValence: 0.51 },
  { date: '2018-02-01', bsi: 48, avgValence: 0.52 },
  { date: '2018-03-01', bsi: 47, avgValence: 0.53 },
  { date: '2018-04-01', bsi: 46, avgValence: 0.54 },
  { date: '2018-05-01', bsi: 48, avgValence: 0.52 },
  { date: '2018-06-01', bsi: 47, avgValence: 0.53 },
  { date: '2018-07-01', bsi: 49, avgValence: 0.51 },
  { date: '2018-08-01', bsi: 50, avgValence: 0.50 },
  { date: '2018-09-01', bsi: 52, avgValence: 0.48 },
  { date: '2018-10-01', bsi: 53, avgValence: 0.47 },
  { date: '2018-11-01', bsi: 54, avgValence: 0.46 },
  { date: '2018-12-01', bsi: 52, avgValence: 0.48 },

  // 2019: Lil Nas X "Old Town Road", Billie Eilish debut, Lizzo "Truth Hurts".
  // Pre-pandemic. BSI 43-51.
  { date: '2019-01-01', bsi: 51, avgValence: 0.49 },
  { date: '2019-02-01', bsi: 50, avgValence: 0.50 },
  { date: '2019-03-01', bsi: 48, avgValence: 0.52 },
  { date: '2019-04-01', bsi: 46, avgValence: 0.54 },
  { date: '2019-05-01', bsi: 45, avgValence: 0.55 },
  { date: '2019-06-01', bsi: 44, avgValence: 0.56 },
  { date: '2019-07-01', bsi: 43, avgValence: 0.57 },
  { date: '2019-08-01', bsi: 45, avgValence: 0.55 },
  { date: '2019-09-01', bsi: 47, avgValence: 0.53 },
  { date: '2019-10-01', bsi: 49, avgValence: 0.51 },
  { date: '2019-11-01', bsi: 50, avgValence: 0.50 },
  { date: '2019-12-01', bsi: 48, avgValence: 0.52 },

  // 2020: COVID. March lockdown = genuine sadness spike. Then escapism kicks in.
  // "Blinding Lights", "Savage Love", "WAP". Late 2020 = very bright.
  { date: '2020-01-01', bsi: 49, avgValence: 0.51 },
  { date: '2020-02-01', bsi: 52, avgValence: 0.48 },
  { date: '2020-03-01', bsi: 65, avgValence: 0.35 }, // COVID lockdown shock
  { date: '2020-04-01', bsi: 70, avgValence: 0.30 }, // Peak sadness
  { date: '2020-05-01', bsi: 58, avgValence: 0.42 }, // Starting to cope
  { date: '2020-06-01', bsi: 48, avgValence: 0.52 }, // BLM + escapism
  { date: '2020-07-01', bsi: 40, avgValence: 0.60 },
  { date: '2020-08-01', bsi: 35, avgValence: 0.65 }, // WAP, Dynamite
  { date: '2020-09-01', bsi: 32, avgValence: 0.68 },
  { date: '2020-10-01', bsi: 30, avgValence: 0.70 },
  { date: '2020-11-01', bsi: 28, avgValence: 0.72 },
  { date: '2020-12-01', bsi: 25, avgValence: 0.75 },

  // 2021: Vaccine rollout euphoria. "Levitating", "Kiss Me More", "Montero".
  // Peak escapist rebound. BSI stays very low.
  { date: '2021-01-01', bsi: 24, avgValence: 0.76 },
  { date: '2021-02-01', bsi: 22, avgValence: 0.78 },
  { date: '2021-03-01', bsi: 20, avgValence: 0.80 }, // Vaccine euphoria
  { date: '2021-04-01', bsi: 21, avgValence: 0.79 },
  { date: '2021-05-01', bsi: 23, avgValence: 0.77 },
  { date: '2021-06-01', bsi: 22, avgValence: 0.78 },
  { date: '2021-07-01', bsi: 25, avgValence: 0.75 },
  { date: '2021-08-01', bsi: 27, avgValence: 0.73 },
  { date: '2021-09-01', bsi: 30, avgValence: 0.70 },
  { date: '2021-10-01', bsi: 33, avgValence: 0.67 },
  { date: '2021-11-01', bsi: 35, avgValence: 0.65 },
  { date: '2021-12-01', bsi: 37, avgValence: 0.63 },

  // 2022: "Vibecession" era. Inflation anxiety but no crash.
  // "As It Was" (Harry Styles), "About Damn Time" (Lizzo), Bad Bunny. BSI normalizing 38-49.
  { date: '2022-01-01', bsi: 38, avgValence: 0.62 },
  { date: '2022-02-01', bsi: 40, avgValence: 0.60 },
  { date: '2022-03-01', bsi: 42, avgValence: 0.58 },
  { date: '2022-04-01', bsi: 44, avgValence: 0.56 },
  { date: '2022-05-01', bsi: 45, avgValence: 0.55 },
  { date: '2022-06-01', bsi: 43, avgValence: 0.57 },
  { date: '2022-07-01', bsi: 42, avgValence: 0.58 },
  { date: '2022-08-01', bsi: 44, avgValence: 0.56 },
  { date: '2022-09-01', bsi: 47, avgValence: 0.53 },
  { date: '2022-10-01', bsi: 49, avgValence: 0.51 },
  { date: '2022-11-01', bsi: 48, avgValence: 0.52 },
  { date: '2022-12-01', bsi: 46, avgValence: 0.54 },

  // 2023: Taylor Swift Eras Tour, "Flowers" (Miley), "Last Night" (Morgan Wallen).
  // Balanced chart. BSI 43-50.
  { date: '2023-01-01', bsi: 45, avgValence: 0.55 },
  { date: '2023-02-01', bsi: 44, avgValence: 0.56 },
  { date: '2023-03-01', bsi: 43, avgValence: 0.57 },
  { date: '2023-04-01', bsi: 45, avgValence: 0.55 },
  { date: '2023-05-01', bsi: 47, avgValence: 0.53 },
  { date: '2023-06-01', bsi: 46, avgValence: 0.54 },
  { date: '2023-07-01', bsi: 44, avgValence: 0.56 },
  { date: '2023-08-01', bsi: 45, avgValence: 0.55 },
  { date: '2023-09-01', bsi: 48, avgValence: 0.52 },
  { date: '2023-10-01', bsi: 50, avgValence: 0.50 },
  { date: '2023-11-01', bsi: 49, avgValence: 0.51 },
  { date: '2023-12-01', bsi: 47, avgValence: 0.53 },

  // 2024: Brat summer! Sabrina Carpenter "Espresso", Charli XCX "360".
  // Very bright summer dip. Taylor "TTPD" adds melancholy in spring.
  { date: '2024-01-01', bsi: 46, avgValence: 0.54 },
  { date: '2024-02-01', bsi: 45, avgValence: 0.55 },
  { date: '2024-03-01', bsi: 44, avgValence: 0.56 },
  { date: '2024-04-01', bsi: 47, avgValence: 0.53 }, // TTPD release
  { date: '2024-05-01', bsi: 43, avgValence: 0.57 },
  { date: '2024-06-01', bsi: 38, avgValence: 0.62 }, // Brat summer begins
  { date: '2024-07-01', bsi: 33, avgValence: 0.67 }, // Peak brat summer
  { date: '2024-08-01', bsi: 30, avgValence: 0.70 }, // Sabrina + Charli domination
  { date: '2024-09-01', bsi: 35, avgValence: 0.65 },
  { date: '2024-10-01', bsi: 38, avgValence: 0.62 },
  { date: '2024-11-01', bsi: 40, avgValence: 0.60 },
  { date: '2024-12-01', bsi: 42, avgValence: 0.58 },

  // 2025: Post-brat normalization. Kendrick Lamar "GNX" album impact.
  // Gracie Abrams, Chappell Roan rising. BSI 36-43.
  { date: '2025-01-01', bsi: 41, avgValence: 0.59 },
  { date: '2025-02-01', bsi: 39, avgValence: 0.61 },
  { date: '2025-03-01', bsi: 38, avgValence: 0.62 },
  { date: '2025-04-01', bsi: 40, avgValence: 0.60 },
  { date: '2025-05-01', bsi: 42, avgValence: 0.58 },
  { date: '2025-06-01', bsi: 39, avgValence: 0.61 },
  { date: '2025-07-01', bsi: 37, avgValence: 0.63 },
  { date: '2025-08-01', bsi: 36, avgValence: 0.64 },
  { date: '2025-09-01', bsi: 38, avgValence: 0.62 },
  { date: '2025-10-01', bsi: 40, avgValence: 0.60 },
  { date: '2025-11-01', bsi: 43, avgValence: 0.57 },
  { date: '2025-12-01', bsi: 41, avgValence: 0.59 },

  // 2026: Current year through Feb
  { date: '2026-01-01', bsi: 38, avgValence: 0.62 },
  { date: '2026-02-01', bsi: 34, avgValence: 0.66 },
  { date: '2026-02-24', bsi: 31, avgValence: 0.69 }, // Current week
];

// ─── S&P 500 Data (matching BSI dates, approximate monthly close) ────────────

export const sp500Data: Sp500DataPoint[] = [
  // 2000: Dot-com peak at ~1500 then decline
  { date: '2000-01-01', value: 1394 },
  { date: '2000-02-01', value: 1366 },
  { date: '2000-03-01', value: 1499 },
  { date: '2000-04-01', value: 1452 },
  { date: '2000-05-01', value: 1420 },
  { date: '2000-06-01', value: 1454 },
  { date: '2000-07-01', value: 1431 },
  { date: '2000-08-01', value: 1518 },
  { date: '2000-09-01', value: 1437 },
  { date: '2000-10-01', value: 1429 },
  { date: '2000-11-01', value: 1315 },
  { date: '2000-12-01', value: 1320 },

  // 2001: 9/11 crash, recovery attempt
  { date: '2001-01-01', value: 1366 },
  { date: '2001-02-01', value: 1240 },
  { date: '2001-03-01', value: 1160 },
  { date: '2001-04-01', value: 1249 },
  { date: '2001-05-01', value: 1255 },
  { date: '2001-06-01', value: 1224 },
  { date: '2001-07-01', value: 1211 },
  { date: '2001-08-01', value: 1133 },
  { date: '2001-09-01', value: 1040 },
  { date: '2001-10-01', value: 1059 },
  { date: '2001-11-01', value: 1139 },
  { date: '2001-12-01', value: 1148 },

  // 2002: Bottom of dot-com bust
  { date: '2002-01-01', value: 1130 },
  { date: '2002-02-01', value: 1106 },
  { date: '2002-03-01', value: 1147 },
  { date: '2002-04-01', value: 1076 },
  { date: '2002-05-01', value: 1068 },
  { date: '2002-06-01', value: 989 },
  { date: '2002-07-01', value: 911 },
  { date: '2002-08-01', value: 916 },
  { date: '2002-09-01', value: 815 },
  { date: '2002-10-01', value: 885 },
  { date: '2002-11-01', value: 936 },
  { date: '2002-12-01', value: 880 },

  // 2003: Recovery begins
  { date: '2003-01-01', value: 855 },
  { date: '2003-02-01', value: 841 },
  { date: '2003-03-01', value: 848 },
  { date: '2003-04-01', value: 917 },
  { date: '2003-05-01', value: 963 },
  { date: '2003-06-01', value: 974 },
  { date: '2003-07-01', value: 990 },
  { date: '2003-08-01', value: 1009 },
  { date: '2003-09-01', value: 996 },
  { date: '2003-10-01', value: 1051 },
  { date: '2003-11-01', value: 1058 },
  { date: '2003-12-01', value: 1112 },

  // 2004: Steady climb
  { date: '2004-01-01', value: 1131 },
  { date: '2004-02-01', value: 1144 },
  { date: '2004-03-01', value: 1127 },
  { date: '2004-04-01', value: 1107 },
  { date: '2004-05-01', value: 1121 },
  { date: '2004-06-01', value: 1141 },
  { date: '2004-07-01', value: 1101 },
  { date: '2004-08-01', value: 1104 },
  { date: '2004-09-01', value: 1115 },
  { date: '2004-10-01', value: 1130 },
  { date: '2004-11-01', value: 1174 },
  { date: '2004-12-01', value: 1212 },

  // 2005
  { date: '2005-01-01', value: 1181 },
  { date: '2005-02-01', value: 1203 },
  { date: '2005-03-01', value: 1180 },
  { date: '2005-04-01', value: 1156 },
  { date: '2005-05-01', value: 1191 },
  { date: '2005-06-01', value: 1191 },
  { date: '2005-07-01', value: 1234 },
  { date: '2005-08-01', value: 1220 },
  { date: '2005-09-01', value: 1228 },
  { date: '2005-10-01', value: 1207 },
  { date: '2005-11-01', value: 1249 },
  { date: '2005-12-01', value: 1248 },

  // 2006
  { date: '2006-01-01', value: 1280 },
  { date: '2006-02-01', value: 1281 },
  { date: '2006-03-01', value: 1294 },
  { date: '2006-04-01', value: 1310 },
  { date: '2006-05-01', value: 1270 },
  { date: '2006-06-01', value: 1270 },
  { date: '2006-07-01', value: 1276 },
  { date: '2006-08-01', value: 1303 },
  { date: '2006-09-01', value: 1335 },
  { date: '2006-10-01', value: 1377 },
  { date: '2006-11-01', value: 1400 },
  { date: '2006-12-01', value: 1418 },

  // 2007: Peak then cracks
  { date: '2007-01-01', value: 1438 },
  { date: '2007-02-01', value: 1406 },
  { date: '2007-03-01', value: 1420 },
  { date: '2007-04-01', value: 1483 },
  { date: '2007-05-01', value: 1530 },
  { date: '2007-06-01', value: 1503 },
  { date: '2007-07-01', value: 1455 },
  { date: '2007-08-01', value: 1474 },
  { date: '2007-09-01', value: 1526 },
  { date: '2007-10-01', value: 1549 },
  { date: '2007-11-01', value: 1481 },
  { date: '2007-12-01', value: 1468 },

  // 2008: Financial crisis
  { date: '2008-01-01', value: 1378 },
  { date: '2008-02-01', value: 1330 },
  { date: '2008-03-01', value: 1323 },
  { date: '2008-04-01', value: 1385 },
  { date: '2008-05-01', value: 1400 },
  { date: '2008-06-01', value: 1280 },
  { date: '2008-07-01', value: 1267 },
  { date: '2008-08-01', value: 1283 },
  { date: '2008-09-01', value: 1166 },
  { date: '2008-10-01', value: 968 },
  { date: '2008-11-01', value: 896 },
  { date: '2008-12-01', value: 903 },

  // 2009: March bottom then recovery
  { date: '2009-01-01', value: 826 },
  { date: '2009-02-01', value: 735 },
  { date: '2009-03-01', value: 757 },
  { date: '2009-04-01', value: 872 },
  { date: '2009-05-01', value: 919 },
  { date: '2009-06-01', value: 919 },
  { date: '2009-07-01', value: 987 },
  { date: '2009-08-01', value: 1021 },
  { date: '2009-09-01', value: 1057 },
  { date: '2009-10-01', value: 1036 },
  { date: '2009-11-01', value: 1096 },
  { date: '2009-12-01', value: 1115 },

  // 2010
  { date: '2010-01-01', value: 1073 },
  { date: '2010-02-01', value: 1104 },
  { date: '2010-03-01', value: 1169 },
  { date: '2010-04-01', value: 1187 },
  { date: '2010-05-01', value: 1089 },
  { date: '2010-06-01', value: 1031 },
  { date: '2010-07-01', value: 1102 },
  { date: '2010-08-01', value: 1049 },
  { date: '2010-09-01', value: 1141 },
  { date: '2010-10-01', value: 1183 },
  { date: '2010-11-01', value: 1180 },
  { date: '2010-12-01', value: 1258 },

  // 2011
  { date: '2011-01-01', value: 1286 },
  { date: '2011-02-01', value: 1327 },
  { date: '2011-03-01', value: 1326 },
  { date: '2011-04-01', value: 1364 },
  { date: '2011-05-01', value: 1345 },
  { date: '2011-06-01', value: 1321 },
  { date: '2011-07-01', value: 1292 },
  { date: '2011-08-01', value: 1219 },
  { date: '2011-09-01', value: 1131 },
  { date: '2011-10-01', value: 1253 },
  { date: '2011-11-01', value: 1247 },
  { date: '2011-12-01', value: 1258 },

  // 2012
  { date: '2012-01-01', value: 1312 },
  { date: '2012-02-01', value: 1366 },
  { date: '2012-03-01', value: 1408 },
  { date: '2012-04-01', value: 1398 },
  { date: '2012-05-01', value: 1310 },
  { date: '2012-06-01', value: 1362 },
  { date: '2012-07-01', value: 1379 },
  { date: '2012-08-01', value: 1406 },
  { date: '2012-09-01', value: 1441 },
  { date: '2012-10-01', value: 1412 },
  { date: '2012-11-01', value: 1416 },
  { date: '2012-12-01', value: 1426 },

  // 2013: Strong bull year
  { date: '2013-01-01', value: 1498 },
  { date: '2013-02-01', value: 1514 },
  { date: '2013-03-01', value: 1569 },
  { date: '2013-04-01', value: 1597 },
  { date: '2013-05-01', value: 1631 },
  { date: '2013-06-01', value: 1606 },
  { date: '2013-07-01', value: 1686 },
  { date: '2013-08-01', value: 1633 },
  { date: '2013-09-01', value: 1682 },
  { date: '2013-10-01', value: 1757 },
  { date: '2013-11-01', value: 1806 },
  { date: '2013-12-01', value: 1848 },

  // 2014
  { date: '2014-01-01', value: 1783 },
  { date: '2014-02-01', value: 1859 },
  { date: '2014-03-01', value: 1872 },
  { date: '2014-04-01', value: 1884 },
  { date: '2014-05-01', value: 1924 },
  { date: '2014-06-01', value: 1960 },
  { date: '2014-07-01', value: 1931 },
  { date: '2014-08-01', value: 2003 },
  { date: '2014-09-01', value: 1972 },
  { date: '2014-10-01', value: 2018 },
  { date: '2014-11-01', value: 2068 },
  { date: '2014-12-01', value: 2059 },

  // 2015
  { date: '2015-01-01', value: 1995 },
  { date: '2015-02-01', value: 2105 },
  { date: '2015-03-01', value: 2068 },
  { date: '2015-04-01', value: 2086 },
  { date: '2015-05-01', value: 2107 },
  { date: '2015-06-01', value: 2063 },
  { date: '2015-07-01', value: 2104 },
  { date: '2015-08-01', value: 1972 },
  { date: '2015-09-01', value: 1920 },
  { date: '2015-10-01', value: 2079 },
  { date: '2015-11-01', value: 2080 },
  { date: '2015-12-01', value: 2044 },

  // 2016
  { date: '2016-01-01', value: 1940 },
  { date: '2016-02-01', value: 1932 },
  { date: '2016-03-01', value: 2060 },
  { date: '2016-04-01', value: 2065 },
  { date: '2016-05-01', value: 2096 },
  { date: '2016-06-01', value: 2099 },
  { date: '2016-07-01', value: 2174 },
  { date: '2016-08-01', value: 2171 },
  { date: '2016-09-01', value: 2168 },
  { date: '2016-10-01', value: 2126 },
  { date: '2016-11-01', value: 2199 },
  { date: '2016-12-01', value: 2239 },

  // 2017: Strong rally
  { date: '2017-01-01', value: 2279 },
  { date: '2017-02-01', value: 2364 },
  { date: '2017-03-01', value: 2363 },
  { date: '2017-04-01', value: 2384 },
  { date: '2017-05-01', value: 2412 },
  { date: '2017-06-01', value: 2423 },
  { date: '2017-07-01', value: 2470 },
  { date: '2017-08-01', value: 2472 },
  { date: '2017-09-01', value: 2519 },
  { date: '2017-10-01', value: 2575 },
  { date: '2017-11-01', value: 2585 },
  { date: '2017-12-01', value: 2674 },

  // 2018: Volatile but up overall
  { date: '2018-01-01', value: 2824 },
  { date: '2018-02-01', value: 2714 },
  { date: '2018-03-01', value: 2641 },
  { date: '2018-04-01', value: 2648 },
  { date: '2018-05-01', value: 2705 },
  { date: '2018-06-01', value: 2718 },
  { date: '2018-07-01', value: 2816 },
  { date: '2018-08-01', value: 2901 },
  { date: '2018-09-01', value: 2914 },
  { date: '2018-10-01', value: 2711 },
  { date: '2018-11-01', value: 2760 },
  { date: '2018-12-01', value: 2507 },

  // 2019: Recovery + new highs
  { date: '2019-01-01', value: 2704 },
  { date: '2019-02-01', value: 2784 },
  { date: '2019-03-01', value: 2834 },
  { date: '2019-04-01', value: 2946 },
  { date: '2019-05-01', value: 2752 },
  { date: '2019-06-01', value: 2942 },
  { date: '2019-07-01', value: 2980 },
  { date: '2019-08-01', value: 2926 },
  { date: '2019-09-01', value: 2976 },
  { date: '2019-10-01', value: 3038 },
  { date: '2019-11-01', value: 3141 },
  { date: '2019-12-01', value: 3231 },

  // 2020: COVID crash then V-recovery
  { date: '2020-01-01', value: 3225 },
  { date: '2020-02-01', value: 2954 },
  { date: '2020-03-01', value: 2585 },
  { date: '2020-04-01', value: 2912 },
  { date: '2020-05-01', value: 3044 },
  { date: '2020-06-01', value: 3100 },
  { date: '2020-07-01', value: 3271 },
  { date: '2020-08-01', value: 3500 },
  { date: '2020-09-01', value: 3363 },
  { date: '2020-10-01', value: 3270 },
  { date: '2020-11-01', value: 3622 },
  { date: '2020-12-01', value: 3756 },

  // 2021: Bull market
  { date: '2021-01-01', value: 3714 },
  { date: '2021-02-01', value: 3811 },
  { date: '2021-03-01', value: 3972 },
  { date: '2021-04-01', value: 4181 },
  { date: '2021-05-01', value: 4204 },
  { date: '2021-06-01', value: 4298 },
  { date: '2021-07-01', value: 4395 },
  { date: '2021-08-01', value: 4522 },
  { date: '2021-09-01', value: 4307 },
  { date: '2021-10-01', value: 4605 },
  { date: '2021-11-01', value: 4567 },
  { date: '2021-12-01', value: 4766 },

  // 2022: Bear market (inflation/rate hikes)
  { date: '2022-01-01', value: 4516 },
  { date: '2022-02-01', value: 4374 },
  { date: '2022-03-01', value: 4530 },
  { date: '2022-04-01', value: 4132 },
  { date: '2022-05-01', value: 4132 },
  { date: '2022-06-01', value: 3785 },
  { date: '2022-07-01', value: 4130 },
  { date: '2022-08-01', value: 3955 },
  { date: '2022-09-01', value: 3586 },
  { date: '2022-10-01', value: 3872 },
  { date: '2022-11-01', value: 4080 },
  { date: '2022-12-01', value: 3840 },

  // 2023: AI-driven recovery
  { date: '2023-01-01', value: 4077 },
  { date: '2023-02-01', value: 3970 },
  { date: '2023-03-01', value: 4109 },
  { date: '2023-04-01', value: 4169 },
  { date: '2023-05-01', value: 4180 },
  { date: '2023-06-01', value: 4450 },
  { date: '2023-07-01', value: 4589 },
  { date: '2023-08-01', value: 4507 },
  { date: '2023-09-01', value: 4288 },
  { date: '2023-10-01', value: 4194 },
  { date: '2023-11-01', value: 4568 },
  { date: '2023-12-01', value: 4770 },

  // 2024: New highs, AI/Mag7 driven
  { date: '2024-01-01', value: 4846 },
  { date: '2024-02-01', value: 5097 },
  { date: '2024-03-01', value: 5254 },
  { date: '2024-04-01', value: 5036 },
  { date: '2024-05-01', value: 5277 },
  { date: '2024-06-01', value: 5460 },
  { date: '2024-07-01', value: 5522 },
  { date: '2024-08-01', value: 5648 },
  { date: '2024-09-01', value: 5762 },
  { date: '2024-10-01', value: 5705 },
  { date: '2024-11-01', value: 5970 },
  { date: '2024-12-01', value: 5882 },

  // 2025: Gradual correction from highs
  { date: '2025-01-01', value: 5810 },
  { date: '2025-02-01', value: 5720 },
  { date: '2025-03-01', value: 5650 },
  { date: '2025-04-01', value: 5580 },
  { date: '2025-05-01', value: 5520 },
  { date: '2025-06-01', value: 5480 },
  { date: '2025-07-01', value: 5410 },
  { date: '2025-08-01', value: 5350 },
  { date: '2025-09-01', value: 5290 },
  { date: '2025-10-01', value: 5320 },
  { date: '2025-11-01', value: 5260 },
  { date: '2025-12-01', value: 5280 },

  // 2026
  { date: '2026-01-01', value: 5250 },
  { date: '2026-02-01', value: 5240 },
  { date: '2026-02-24', value: 5234 },
];

// ─── Current Week ────────────────────────────────────────────────────────────

export const currentWeekData: CurrentWeek = {
  weekDate: '2026-02-24',
  bsi: 31,
  prevBsi: 38,
  weeklyChange: -7,
  avgValence: 0.69,
  trackCount: 100,
  mostSadTrack: {
    title: 'Luther',
    artist: 'Kendrick Lamar ft. SZA',
    valence: 0.18,
    rank: 3,
  },
  mostHappyTrack: {
    title: 'APT.',
    artist: 'ROSE & Bruno Mars',
    valence: 0.89,
    rank: 7,
  },
  economicIndicators: {
    sp500: { value: 5234, change: -1.2 },
    vix: { value: 22.4, change: 3.1 },
    unemployment: { value: 4.1, change: 0.1 },
    consumerSentiment: { value: 64.7, change: -2.3 },
  },
};

// ─── Top Tracks This Week ────────────────────────────────────────────────────

export const topTracksThisWeek: Track[] = [
  { rank: 1, title: 'Die With A Smile', artist: 'Lady Gaga & Bruno Mars', valence: 0.54 },
  { rank: 2, title: 'Squabble Up', artist: 'Kendrick Lamar', valence: 0.72 },
  { rank: 3, title: 'Luther', artist: 'Kendrick Lamar ft. SZA', valence: 0.18 },
  { rank: 4, title: 'Timeless', artist: 'The Weeknd & Playboi Carti', valence: 0.42 },
  { rank: 5, title: 'Ordinary', artist: 'Billie Eilish', valence: 0.31 },
  { rank: 6, title: "That's So True", artist: 'Gracie Abrams', valence: 0.38 },
  { rank: 7, title: 'APT.', artist: 'ROSE & Bruno Mars', valence: 0.89 },
  { rank: 8, title: 'Sweetest Pie', artist: 'Sabrina Carpenter', valence: 0.82 },
  { rank: 9, title: 'Mantra', artist: 'Jennie', valence: 0.76 },
  { rank: 10, title: 'Nights Like This', artist: 'Future & Metro Boomin ft. Drake', valence: 0.45 },
  { rank: 11, title: 'Rompelo', artist: 'Bad Bunny', valence: 0.85 },
  { rank: 12, title: 'Messy', artist: 'Lola Young', valence: 0.35 },
  { rank: 13, title: 'Taste', artist: 'Sabrina Carpenter', valence: 0.78 },
  { rank: 14, title: 'Abracadabra', artist: 'Lady Gaga', valence: 0.81 },
  { rank: 15, title: 'St. Augustine', artist: 'Teddy Swims', valence: 0.27 },
  { rank: 16, title: 'All I Ever Need', artist: 'Post Malone', valence: 0.48 },
  { rank: 17, title: 'Right Person Wrong Time', artist: 'Chappell Roan', valence: 0.33 },
  { rank: 18, title: 'Wacced Out Murals', artist: 'Kendrick Lamar', valence: 0.58 },
  { rank: 19, title: 'Pink Pony Club', artist: 'Chappell Roan', valence: 0.71 },
  { rank: 20, title: 'Saturn', artist: 'SZA', valence: 0.25 },
];

// ─── Historical Events (chart annotations) ──────────────────────────────────

export const historicalEvents: HistoricalEvent[] = [
  // BSI values populated dynamically from bsi_weekly DB
  { date: '2000-03-10', label: 'Dot-com Peak' },
  { date: '2001-09-11', label: '9/11 Attacks' },
  { date: '2001-11-01', label: 'Post-9/11 Escapism' },
  { date: '2002-10-09', label: 'Dot-com Bottom' },
  { date: '2005-08-29', label: 'Hurricane Katrina' },
  { date: '2007-10-09', label: 'Pre-Crisis Peak' },
  { date: '2008-09-15', label: 'Lehman Brothers Bankruptcy' },
  { date: '2008-10-01', label: 'Peak Escapism (GFC)' },
  { date: '2009-03-09', label: 'Market Bottom' },
  { date: '2009-06-01', label: 'Recession Pop Peak' },
  { date: '2012-09-01', label: 'Gangnam Style' },
  { date: '2014-05-01', label: '"Happy" (Pharrell) Era' },
  { date: '2015-11-01', label: 'Adele "Hello" Peak' },
  { date: '2016-11-01', label: 'Post-Election Mood' },
  { date: '2020-03-11', label: 'COVID-19 Pandemic Declared' },
  { date: '2020-04-01', label: 'COVID Lockdown Peak Sadness' },
  { date: '2020-11-09', label: 'Pfizer Vaccine News' },
  { date: '2021-03-01', label: 'Vaccine Euphoria Peak' },
  { date: '2022-06-01', label: 'Bear Market + Vibecession' },
  { date: '2023-03-10', label: 'SVB Collapse' },
  { date: '2024-08-01', label: 'Brat Summer Peak' },
];
