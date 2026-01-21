import React, { useState, useEffect } from 'react';
import { Home, Zap, DollarSign, Plus, Trash2, Sun, Cloud, TrendingUp, Calendar, Clock, Settings, AlertCircle, Upload, FileText, BarChart3, Lightbulb, Target, Award, X } from 'lucide-react';

const SRPBillSimulator = () => {
  const [homeType, setHomeType] = useState('single-family');
  const [squareFootage, setSquareFootage] = useState(1500);
  const [season, setSeason] = useState('summer');
  const [baseRate, setBaseRate] = useState(0.14);
  const [appliances, setAppliances] = useState([]);
  const [customAppliance, setCustomAppliance] = useState({
    name: '',
    watts: 100,
    hoursPerDay: 1,
    quantity: 1
  });
  
  // New states for bill history
  const [billHistory, setBillHistory] = useState([]);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [manualBillEntry, setManualBillEntry] = useState({
    month: '',
    year: new Date().getFullYear(),
    totalCost: '',
    totalKwh: '',
    peakKwh: '',
    offPeakKwh: ''
  });
  const [analysisResults, setAnalysisResults] = useState(null);
  const [savingsStrategies, setSavingsStrategies] = useState([]);
  const [selectedStrategy, setSelectedStrategy] = useState(null);

  // Common appliances database
  const applianceTemplates = {
    // HVAC
    centralAC: { name: 'Central A/C', watts: 3500, category: 'HVAC', icon: '❄️', seasonal: true },
    windowAC: { name: 'Window A/C', watts: 1200, category: 'HVAC', icon: '❄️', seasonal: true },
    heater: { name: 'Space Heater', watts: 1500, category: 'HVAC', icon: '🔥', seasonal: true },
    ceilingFan: { name: 'Ceiling Fan', watts: 75, category: 'HVAC', icon: '🌀' },
    
    // Kitchen
    refrigerator: { name: 'Refrigerator', watts: 150, category: 'Kitchen', icon: '🧊', alwaysOn: true },
    freezer: { name: 'Freezer', watts: 100, category: 'Kitchen', icon: '🧊', alwaysOn: true },
    dishwasher: { name: 'Dishwasher', watts: 1800, category: 'Kitchen', icon: '🍽️' },
    microwave: { name: 'Microwave', watts: 1000, category: 'Kitchen', icon: '📻' },
    oven: { name: 'Electric Oven', watts: 2400, category: 'Kitchen', icon: '🔥' },
    coffeeMaker: { name: 'Coffee Maker', watts: 800, category: 'Kitchen', icon: '☕' },
    toaster: { name: 'Toaster', watts: 1200, category: 'Kitchen', icon: '🍞' },
    
    // Laundry
    washer: { name: 'Washing Machine', watts: 500, category: 'Laundry', icon: '👕' },
    dryer: { name: 'Dryer', watts: 3000, category: 'Laundry', icon: '🌀' },
    
    // Entertainment
    tv55: { name: '55" LED TV', watts: 80, category: 'Entertainment', icon: '📺' },
    tv75: { name: '75" LED TV', watts: 120, category: 'Entertainment', icon: '📺' },
    gameConsole: { name: 'Game Console', watts: 150, category: 'Entertainment', icon: '🎮' },
    computer: { name: 'Desktop Computer', watts: 200, category: 'Entertainment', icon: '💻' },
    laptop: { name: 'Laptop', watts: 50, category: 'Entertainment', icon: '💻' },
    phone: { name: 'Smartphone', watts: 5, category: 'Entertainment', icon: '📱' },
    tablet: { name: 'Tablet', watts: 10, category: 'Entertainment', icon: '📱' },
    camera: { name: 'Camera', watts: 50, category: 'Entertainment', icon: '📸' },
    projector: { name: 'Projector', watts: 1000, category: 'Entertainment', icon: '📽️' },

    //extra
    fan: { name: 'Fan', watts: 100, category: 'Other', icon: '🌀' },
    mining: { name: 'Mining Rig', watts: 1000, category: 'Other', icon: '💎' },
    nodes: { name: 'Server Nodes', watts: 1000, category: 'Other', icon: '🖥️' },
    
    // Lighting
    led60w: { name: 'LED Bulb (60W equiv)', watts: 9, category: 'Lighting', icon: '💡' },
    led100w: { name: 'LED Bulb (100W equiv)', watts: 15, category: 'Lighting', icon: '💡' },
    
    // Other
    waterHeater: { name: 'Water Heater', watts: 4500, category: 'Other', icon: '🚿', alwaysOn: true },
    poolPump: { name: 'Pool Pump', watts: 2000, category: 'Other', icon: '🏊' },
    evCharger: { name: 'EV Charger', watts: 7200, category: 'Other', icon: '🔌' },
    dehumidifier: { name: 'Dehumidifier', watts: 280, category: 'Other', icon: '💧' },
    generator: { name: 'Generator', watts: 5000, category: 'Other', icon: '⚡' },
  };

  // Seasonal rate adjustments (SRP-like structure)
  const seasonalRates = {
    summer: { base: 0.14, peak: 0.26, name: 'Summer (May-Oct)' },
    winter: { base: 0.10, peak: 0.14, name: 'Winter (Nov-Apr)' }
  };

  // Base load estimates by home type and size
  const calculateBaseLoad = () => {
    let baseKwh = 0;
    
    // HVAC baseline (adjusted for season and home size)
    const hvacMultiplier = season === 'summer' ? 1.5 : 0.6;
    const sizeMultiplier = squareFootage / 1000;
    
    if (homeType === 'apartment') {
      baseKwh = 200 * hvacMultiplier * sizeMultiplier * 0.7;
    } else if (homeType === 'single-family') {
      baseKwh = 300 * hvacMultiplier * sizeMultiplier;
    } else if (homeType === 'townhouse') {
      baseKwh = 250 * hvacMultiplier * sizeMultiplier * 0.85;
    }
    
    return baseKwh;
  };

  const addAppliance = (templateKey) => {
    const template = applianceTemplates[templateKey];
    const defaultHours = template.alwaysOn ? 24 : template.seasonal ? 8 : 2;
    
    setAppliances([...appliances, {
      id: Date.now(),
      ...template,
      hoursPerDay: defaultHours,
      quantity: 1
    }]);
  };

  const addCustomAppliance = () => {
    if (!customAppliance.name) return;
    
    setAppliances([...appliances, {
      id: Date.now(),
      ...customAppliance,
      category: 'Custom',
      icon: '⚡'
    }]);
    
    setCustomAppliance({
      name: '',
      watts: 100,
      hoursPerDay: 1,
      quantity: 1
    });
  };

  const removeAppliance = (id) => {
    setAppliances(appliances.filter(a => a.id !== id));
  };

  const updateAppliance = (id, field, value) => {
    setAppliances(appliances.map(a => 
      a.id === id ? { ...a, [field]: parseFloat(value) || 0 } : a
    ));
  };

  // Calculate monthly usage and costs
  const calculateBill = () => {
    const baseLoad = calculateBaseLoad();
    
    let totalKwhPerDay = 0;
    let applianceBreakdown = [];
    
    appliances.forEach(appliance => {
      const dailyKwh = (appliance.watts * appliance.hoursPerDay * appliance.quantity) / 1000;
      totalKwhPerDay += dailyKwh;
      applianceBreakdown.push({
        name: appliance.name,
        dailyKwh,
        monthlyKwh: dailyKwh * 30,
        monthlyCost: dailyKwh * 30 * baseRate
      });
    });
    
    const totalMonthlyKwh = (totalKwhPerDay * 30) + baseLoad;
    const baseCost = totalMonthlyKwh * seasonalRates[season].base;
    
    // Add SRP basic service charge
    const serviceCharge = 15.00;
    const totalCost = baseCost + serviceCharge;
    
    return {
      baseLoad,
      applianceKwh: totalKwhPerDay * 30,
      totalMonthlyKwh,
      baseCost,
      serviceCharge,
      totalCost,
      breakdown: applianceBreakdown.sort((a, b) => b.monthlyCost - a.monthlyCost),
      avgDailyCost: totalCost / 30
    };
  };

  const bill = calculateBill();

  // Handle file upload for bill history
  const handleFileUpload = async (e) => { 
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      alert('Only PDF, PNG, and JPG files are allowed.');
      return;
    }

    try {
      const text = await file.text();
      // Simple parsing logic - in production, this would use OCR/PDF parsing
      // For demo, we'll show the manual entry form
      alert('Bill uploaded! Please verify the extracted data below and adjust if needed.');
      setShowHistoryPanel(true);
    } catch (error) {
      console.error('Error reading file:', error);
      alert('Error reading file. Please enter data manually.');
    }
  };

  // Add manual bill entry to history
  const addBillToHistory = () => {
    if (!manualBillEntry.month || !manualBillEntry.totalCost || !manualBillEntry.totalKwh) {
      alert('Please fill in at least month, total cost, and total kWh');
      return;
    }

    const newBill = {
      id: Date.now(),
      ...manualBillEntry,
      totalCost: parseFloat(manualBillEntry.totalCost),
      totalKwh: parseFloat(manualBillEntry.totalKwh),
      peakKwh: parseFloat(manualBillEntry.peakKwh) || 0,
      offPeakKwh: parseFloat(manualBillEntry.offPeakKwh) || 0,
      avgRate: parseFloat(manualBillEntry.totalCost) / parseFloat(manualBillEntry.totalKwh)
    };

    setBillHistory([...billHistory, newBill].sort((a, b) => {
      const aDate = new Date(a.year, getMonthIndex(a.month));
      const bDate = new Date(b.year, getMonthIndex(b.month));
      return aDate - bDate;
    }));

    setManualBillEntry({
      month: '',
      year: new Date().getFullYear(),
      totalCost: '',
      totalKwh: '',
      peakKwh: '',
      offPeakKwh: ''
    });
  };

  const getMonthIndex = (monthName) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months.indexOf(monthName);
  };

  const removeBillFromHistory = (id) => {
    setBillHistory(billHistory.filter(b => b.id !== id));
  };

  // Analyze bill history
  const analyzeBillHistory = () => {
    if (billHistory.length < 3) {
      alert('Please add at least 3 months of bill history for accurate analysis');
      return;
    }

    const totalCosts = billHistory.map(b => b.totalCost);
    const totalKwhs = billHistory.map(b => b.totalKwh);
    
    const avgMonthlyCost = totalCosts.reduce((a, b) => a + b, 0) / totalCosts.length;
    const avgMonthlyKwh = totalKwhs.reduce((a, b) => a + b, 0) / totalKwhs.length;
    const highestBill = Math.max(...totalCosts);
    const lowestBill = Math.min(...totalCosts);
    const highestMonth = billHistory.find(b => b.totalCost === highestBill);
    const lowestMonth = billHistory.find(b => b.totalCost === lowestBill);
    
    // Calculate trends
    const recentThreeMonths = billHistory.slice(-3);
    const previousThreeMonths = billHistory.slice(-6, -3);
    
    let trend = 'stable';
    if (recentThreeMonths.length === 3 && previousThreeMonths.length === 3) {
      const recentAvg = recentThreeMonths.reduce((a, b) => a + b.totalCost, 0) / 3;
      const previousAvg = previousThreeMonths.reduce((a, b) => a + b.totalCost, 0) / 3;
      
      if (recentAvg > previousAvg * 1.15) trend = 'increasing';
      else if (recentAvg < previousAvg * 0.85) trend = 'decreasing';
    }

    // Peak usage analysis
    const peakUsageMonths = billHistory.filter(b => b.totalKwh > avgMonthlyKwh * 1.2);
    const summerMonths = billHistory.filter(b => 
      ['May', 'June', 'July', 'August', 'September', 'October'].includes(b.month)
    );
    const winterMonths = billHistory.filter(b => 
      ['November', 'December', 'January', 'February', 'March', 'April'].includes(b.month)
    );

    const avgSummerCost = summerMonths.length > 0 
      ? summerMonths.reduce((a, b) => a + b.totalCost, 0) / summerMonths.length 
      : 0;
    const avgWinterCost = winterMonths.length > 0 
      ? winterMonths.reduce((a, b) => a + b.totalCost, 0) / winterMonths.length 
      : 0;

    setAnalysisResults({
      avgMonthlyCost,
      avgMonthlyKwh,
      highestBill,
      lowestBill,
      highestMonth,
      lowestMonth,
      trend,
      peakUsageMonths,
      avgSummerCost,
      avgWinterCost,
      annualEstimate: avgMonthlyCost * 12
    });

    generateSavingsStrategies(avgMonthlyCost, avgMonthlyKwh, trend, avgSummerCost, avgWinterCost);
  };

  // Generate personalized savings strategies
  const generateSavingsStrategies = (avgCost, avgKwh, trend, summerCost, winterCost) => {
    const strategies = [];

    // Strategy 1: Time-of-Use Plan
    if (avgKwh > 800) {
      const estimatedSavings = avgCost * 0.15;
      strategies.push({
        id: 'tou',
        title: 'Switch to Time-of-Use Plan',
        category: 'Rate Plan',
        difficulty: 'Easy',
        monthlySavings: estimatedSavings,
        annualSavings: estimatedSavings * 12,
        effort: 'Low',
        payback: 'Immediate',
        description: 'Move heavy usage to off-peak hours (9pm-3pm weekdays, all day weekends)',
        steps: [
          'Contact SRP to switch to TOU plan',
          'Run dishwasher, laundry, and pool pump during off-peak hours',
          'Pre-cool home before 3pm in summer',
          'Set water heater timer for off-peak hours'
        ],
        impact: 'Save 10-20% on bills by shifting usage'
      });
    }

    // Strategy 2: A/C Optimization
    if (summerCost > winterCost * 1.5) {
      const estimatedSavings = (summerCost - winterCost) * 0.3;
      strategies.push({
        id: 'ac-optimize',
        title: 'A/C System Optimization',
        category: 'Cooling',
        difficulty: 'Medium',
        monthlySavings: estimatedSavings,
        annualSavings: estimatedSavings * 6,
        effort: 'Medium',
        payback: '3-6 months',
        description: 'Optimize your cooling system for maximum efficiency',
        steps: [
          'Install programmable thermostat ($150)',
          'Set to 78°F when home, 82°F when away',
          'Replace air filters monthly ($15/month)',
          'Schedule annual A/C maintenance ($100/year)',
          'Add attic insulation if needed ($500-1500)',
          'Seal air leaks around doors/windows'
        ],
        impact: 'Reduce summer cooling costs by 20-30%'
      });
    }

    // Strategy 3: Solar Installation
    if (avgCost > 150) {
      const estimatedSavings = avgCost * 0.70;
      strategies.push({
        id: 'solar',
        title: 'Residential Solar Installation',
        category: 'Generation',
        difficulty: 'Hard',
        monthlySavings: estimatedSavings,
        annualSavings: estimatedSavings * 12,
        effort: 'High',
        payback: '6-8 years',
        description: 'Generate your own clean electricity',
        steps: [
          'Get solar quotes from 3+ installers',
          'Apply for SRP net metering',
          'Consider battery storage for backup',
          'Take advantage of 30% federal tax credit',
          'Typical 6-8kW system costs $15,000-25,000 after incentives'
        ],
        impact: 'Eliminate 60-90% of electric bills'
      });
    }

    // Strategy 4: LED Lighting Upgrade
    strategies.push({
      id: 'led-upgrade',
      title: 'Complete LED Lighting Upgrade',
      category: 'Lighting',
      difficulty: 'Easy',
      monthlySavings: 15,
      annualSavings: 180,
      effort: 'Low',
      payback: '6-12 months',
      description: 'Replace all incandescent and CFL bulbs with LEDs',
      steps: [
        'Count all bulbs in your home',
        'Purchase LED replacements (~$2-5 each)',
        'Replace bulbs as they burn out or all at once',
        'Focus on most-used rooms first'
      ],
      impact: 'Reduce lighting costs by 75%'
    });

    // Strategy 5: Smart Power Strips
    strategies.push({
      id: 'phantom-load',
      title: 'Eliminate Phantom Loads',
      category: 'Efficiency',
      difficulty: 'Easy',
      monthlySavings: 12,
      annualSavings: 144,
      effort: 'Low',
      payback: '2-3 months',
      description: 'Stop vampire power drain from devices',
      steps: [
        'Install smart power strips ($25-40 each)',
        'Plug entertainment centers into smart strips',
        'Use for computer/printer setups',
        'Unplug phone chargers when not in use',
        'Turn off devices at power strip when not needed'
      ],
      impact: 'Save 5-10% on electric bills'
    });

    // Strategy 6: Water Heater Upgrade
    if (avgKwh > 1000) {
      strategies.push({
        id: 'water-heater',
        title: 'Heat Pump Water Heater',
        category: 'Hot Water',
        difficulty: 'Hard',
        monthlySavings: 30,
        annualSavings: 360,
        effort: 'High',
        payback: '4-6 years',
        description: 'Upgrade to ultra-efficient heat pump water heater',
        steps: [
          'Research heat pump water heater models',
          'Get installation quotes ($1,200-2,500)',
          'Apply for utility rebates (up to $300)',
          'Professional installation required',
          'Set timer for off-peak operation'
        ],
        impact: 'Use 50-60% less energy for hot water'
      });
    }

    // Strategy 7: Pool Pump Efficiency
    const hasPool = appliances.some(a => a.name.includes('Pool'));
    if (hasPool || avgKwh > 1500) {
      strategies.push({
        id: 'pool-pump',
        title: 'Variable Speed Pool Pump',
        category: 'Pool',
        difficulty: 'Medium',
        monthlySavings: 45,
        annualSavings: 540,
        effort: 'Medium',
        payback: '2-3 years',
        description: 'Replace single-speed pump with variable speed model',
        steps: [
          'Purchase variable speed pump ($800-1,500)',
          'Qualify for SRP rebate (up to $200)',
          'Professional installation ($200-400)',
          'Run on lowest speed that maintains water quality',
          'Schedule for off-peak hours only'
        ],
        impact: 'Reduce pool energy costs by 65-75%'
      });
    }

    // Strategy 8: Demand Response Program
    strategies.push({
      id: 'demand-response',
      title: 'SRP M-Power Pre-Paid Plan',
      category: 'Rate Plan',
      difficulty: 'Easy',
      monthlySavings: avgCost * 0.08,
      annualSavings: avgCost * 0.08 * 12,
      effort: 'Low',
      payback: 'Immediate',
      description: 'Pay-as-you-go plan with real-time usage tracking',
      steps: [
        'Enroll in M-Power online',
        'No deposit or credit check required',
        'Monitor usage daily via app',
        'Adjust behavior based on real-time costs',
        'Avoid peak hours to maximize savings'
      ],
      impact: 'Save 5-10% through better awareness'
    });

    setSavingsStrategies(strategies.sort((a, b) => b.annualSavings - a.annualSavings));
  };

  // Group appliances by category
  const groupedTemplates = {};
  Object.entries(applianceTemplates).forEach(([key, template]) => {
    if (!groupedTemplates[template.category]) {
      groupedTemplates[template.category] = [];
    }
    groupedTemplates[template.category].push({ key, ...template });
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8 space-y-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Zap className="text-yellow-400" size={40} />
              SRP Electric Bill Cost Simulator
            </h1>
            <p className="text-slate-400 mt-2">Estimate your monthly electricity costs based on actual usage</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowHistoryPanel(!showHistoryPanel)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl active:scale-95 ${
                showHistoryPanel 
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800' 
                  : 'bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700'
              }`}
              title={`${showHistoryPanel ? 'Hide' : 'Show'} bill history panel`}
            >
              <BarChart3 size={20} />
              Bill History ({billHistory.length})
            </button>
          </div>
        </div>

        {/* Bill History Panel - Modal Overlay */}
        {showHistoryPanel && (
          <>
            {/* Backdrop Overlay */}
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
              onClick={() => setShowHistoryPanel(false)}
            />
            
            {/* Modal Content */}
            <div className="fixed inset-4 md:inset-8 lg:inset-16 bg-slate-800/95 backdrop-blur-xl rounded-2xl border-2 border-slate-700 shadow-2xl z-50 overflow-y-auto animate-fade-in scroll-smooth">
              <div className="sticky top-0 bg-slate-800/95 backdrop-blur-xl border-b border-slate-700 p-6 flex items-center justify-between z-10">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <FileText className="text-purple-400" size={28} />
                  Bill History & Analysis
                </h2>
                <button
                  onClick={() => setShowHistoryPanel(false)}
                  className="p-2 rounded-lg bg-slate-700 hover:bg-red-600 transition-all transform hover:scale-110 shadow-lg"
                  aria-label="Close panel"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6">


            {/* Upload Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-400 mb-3">Upload Past Bills</h3>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:border-purple-500 transition-all duration-300 bg-slate-700/30 hover:bg-slate-700/50 transform hover:scale-[1.02]">
                  <Upload className="text-slate-400 mb-2" size={32} />
                  <span className="text-sm text-slate-400">Click to upload PDF or image</span>
                  <span className="text-xs text-slate-500 mt-1">Supports PDF, JPG, PNG</span>
                  <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} />
                </label>
              </div>

              {/* Manual Entry */}
              <div>
                <h3 className="text-sm font-semibold text-slate-400 mb-3">Manual Entry</h3>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={manualBillEntry.month}
                    onChange={(e) => setManualBillEntry({...manualBillEntry, month: e.target.value})}
                    className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                  >
                    <option value="">Month</option>
                    {['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Year"
                    value={manualBillEntry.year}
                    onChange={(e) => setManualBillEntry({...manualBillEntry, year: e.target.value})}
                    className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Total Cost ($)"
                    value={manualBillEntry.totalCost}
                    onChange={(e) => setManualBillEntry({...manualBillEntry, totalCost: e.target.value})}
                    className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Total kWh"
                    value={manualBillEntry.totalKwh}
                    onChange={(e) => setManualBillEntry({...manualBillEntry, totalKwh: e.target.value})}
                    className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                  />
                  <button
                    onClick={addBillToHistory}
                    className="col-span-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-lg py-2 font-semibold transition-all transform hover:scale-105 shadow-md hover:shadow-lg text-sm"
                  >
                    Add to History
                  </button>
                </div>
              </div>
            </div>

            {/* Bill History List */}
            {billHistory.length > 0 && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
                  <h3 className="text-sm font-semibold text-slate-400">Your Bills ({billHistory.length} months)</h3>
                  <button
                    onClick={analyzeBillHistory}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-4 py-2 rounded-lg font-semibold text-sm transition-all transform hover:scale-105 shadow-md hover:shadow-lg flex items-center gap-2 active:scale-95"
                    title="Analyze your bill history and get personalized savings recommendations"
                  >
                    <BarChart3 size={16} />
                    Analyze & Get Savings Plan
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto">
                  {billHistory.map(bill => (
                    <div key={bill.id} className="bg-slate-700/50 rounded-lg p-3 border border-slate-600 relative hover:border-slate-500 transition-all duration-200 hover:shadow-md transform hover:scale-105">
                      <button
                        onClick={() => removeBillFromHistory(bill.id)}
                        className="absolute top-1 right-1 p-1 bg-red-500/20 hover:bg-red-500/40 rounded transition-all transform hover:scale-110 shadow-sm"
                        aria-label="Remove bill"
                      >
                        <Trash2 size={12} className="text-red-400" />
                      </button>
                      <div className="text-xs font-semibold text-cyan-400 mb-1">{bill.month} '{String(bill.year).slice(-2)}</div>
                      <div className="text-lg font-bold text-green-400">${bill.totalCost.toFixed(2)}</div>
                      <div className="text-xs text-slate-400">{bill.totalKwh} kWh</div>
                      <div className="text-xs text-slate-500">${bill.avgRate.toFixed(3)}/kWh</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Analysis Results */}
            {analysisResults && (
              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="text-purple-400" size={20} />
                  Usage Analysis
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="text-xs text-slate-400 mb-1">Avg Monthly</div>
                    <div className="text-xl font-bold text-purple-400">${analysisResults.avgMonthlyCost.toFixed(2)}</div>
                    <div className="text-xs text-slate-500">{analysisResults.avgMonthlyKwh.toFixed(0)} kWh</div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="text-xs text-slate-400 mb-1">Highest Bill</div>
                    <div className="text-xl font-bold text-red-400">${analysisResults.highestBill.toFixed(2)}</div>
                    <div className="text-xs text-slate-500">{analysisResults.highestMonth.month}</div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="text-xs text-slate-400 mb-1">Lowest Bill</div>
                    <div className="text-xl font-bold text-green-400">${analysisResults.lowestBill.toFixed(2)}</div>
                    <div className="text-xs text-slate-500">{analysisResults.lowestMonth.month}</div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="text-xs text-slate-400 mb-1">Annual Est.</div>
                    <div className="text-xl font-bold text-yellow-400">${analysisResults.annualEstimate.toFixed(2)}</div>
                    <div className={`text-xs font-semibold ${
                      analysisResults.trend === 'increasing' ? 'text-red-400' : 
                      analysisResults.trend === 'decreasing' ? 'text-green-400' : 'text-slate-400'
                    }`}>
                      {analysisResults.trend === 'increasing' ? '📈 Increasing' : 
                       analysisResults.trend === 'decreasing' ? '📉 Decreasing' : '➡️ Stable'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                    <div className="text-sm font-semibold text-orange-400 mb-1">Summer Average</div>
                    <div className="text-2xl font-bold text-orange-300">${analysisResults.avgSummerCost.toFixed(2)}/mo</div>
                    <div className="text-xs text-orange-200 mt-1">May - October</div>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                    <div className="text-sm font-semibold text-blue-400 mb-1">Winter Average</div>
                    <div className="text-2xl font-bold text-blue-300">${analysisResults.avgWinterCost.toFixed(2)}/mo</div>
                    <div className="text-xs text-blue-200 mt-1">November - April</div>
                  </div>
                </div>
              </div>
            )}

            {/* Savings Strategies */}
            {savingsStrategies.length > 0 && (
              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Lightbulb className="text-yellow-400" size={20} />
                  Personalized Savings Strategies ({savingsStrategies.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {savingsStrategies.map(strategy => (
                    <div
                      key={strategy.id}
                      onClick={() => setSelectedStrategy(selectedStrategy?.id === strategy.id ? null : strategy)}
                      className={`bg-slate-700/50 rounded-lg p-4 border-2 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
                        selectedStrategy?.id === strategy.id 
                          ? 'border-green-500 bg-green-500/10 shadow-lg shadow-green-500/20' 
                          : 'border-slate-600 hover:border-slate-500 hover:shadow-lg'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-white mb-1">{strategy.title}</h4>
                          <div className="flex gap-2 flex-wrap">
                            <span className="text-xs px-2 py-0.5 bg-purple-500/30 text-purple-300 rounded">
                              {strategy.category}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              strategy.difficulty === 'Easy' ? 'bg-green-500/30 text-green-300' :
                              strategy.difficulty === 'Medium' ? 'bg-yellow-500/30 text-yellow-300' :
                              'bg-red-500/30 text-red-300'
                            }`}>
                              {strategy.difficulty}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-400">${strategy.annualSavings.toFixed(0)}/yr</div>
                          <div className="text-xs text-slate-400">${strategy.monthlySavings.toFixed(0)}/mo</div>
                        </div>
                      </div>
                      
                      <p className="text-sm text-slate-300 mb-2">{strategy.description}</p>
                      
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Effort: {strategy.effort}</span>
                        <span>Payback: {strategy.payback}</span>
                      </div>

                      {selectedStrategy?.id === strategy.id && (
                        <div className="mt-4 pt-4 border-t border-slate-600">
                          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-3">
                            <div className="font-semibold text-green-400 mb-1">💰 Impact</div>
                            <div className="text-sm text-green-300">{strategy.impact}</div>
                          </div>
                          
                          <div className="bg-slate-800/50 rounded-lg p-3">
                            <div className="font-semibold text-cyan-400 mb-2">📋 Action Steps:</div>
                            <ol className="space-y-1">
                              {strategy.steps.map((step, i) => (
                                <li key={i} className="text-sm text-slate-300 flex gap-2">
                                  <span className="text-cyan-400 font-semibold">{i + 1}.</span>
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Total Potential Savings */}
                <div className="mt-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-6">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-green-400 mb-1">💎 Total Potential Savings</h3>
                      <p className="text-sm text-green-300">If you implement all strategies above</p>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold text-green-400">
                        ${savingsStrategies.reduce((sum, s) => sum + s.annualSavings, 0).toFixed(0)}
                      </div>
                      <div className="text-sm text-green-300">per year</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
              </div>
            </div>
          </>
        )}

        {/* Configuration Panel */}
        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 md:p-8 border border-slate-700 shadow-xl mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Settings className="text-cyan-400" size={24} />
            Home Configuration
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Home Type</label>
              <select
                value={homeType}
                onChange={(e) => setHomeType(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
              >
                <option value="apartment">🏢 Apartment</option>
                <option value="townhouse">🏘️ Townhouse</option>
                <option value="single-family">🏠 Single Family</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Square Footage</label>
              <input
                type="range"
                min="500"
                max="5000"
                step="100"
                value={squareFootage}
                onChange={(e) => setSquareFootage(Number(e.target.value))}
                className="w-full"
              />
              <div className="text-center text-cyan-400 font-bold mt-1">{squareFootage.toLocaleString()} sq ft</div>
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Season</label>
              <select
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
              >
                <option value="summer">☀️ {seasonalRates.summer.name}</option>
                <option value="winter">❄️ {seasonalRates.winter.name}</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Rate ($/kWh)</label>
              <input
                type="number"
                step="0.01"
                value={baseRate}
                onChange={(e) => setBaseRate(Number(e.target.value))}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
              />
              <div className="text-center text-slate-500 text-xs mt-1">Season: ${seasonalRates[season].base}</div>
            </div>
          </div>
        

        {/* Cost Summary */}
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 lg:gap-6 mb-6">
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-4 md:p-5 shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-sm text-green-300 mb-1">Base Load</div>
            <div className="text-2xl font-bold text-green-400">{bill.baseLoad.toFixed(0)} kWh</div>
            <div className="text-xs text-green-300 mt-1">HVAC & Structure</div>
          </div>
          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-xl p-4 md:p-5 shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-sm text-blue-300 mb-1">Appliances</div>
            <div className="text-2xl font-bold text-blue-400">{bill.applianceKwh.toFixed(0)} kWh</div>
            <div className="text-xs text-blue-300 mt-1">{appliances.length} devices</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-4 md:p-5 shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-sm text-purple-300 mb-1">Total Usage</div>
            <div className="text-2xl font-bold text-purple-400">{bill.totalMonthlyKwh.toFixed(0)} kWh</div>
            <div className="text-xs text-purple-300 mt-1">Per month</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl p-4 md:p-5 shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-sm text-yellow-300 mb-1">Daily Cost</div>
            <div className="text-2xl font-bold text-yellow-400">${bill.avgDailyCost.toFixed(2)}</div>
            <div className="text-xs text-yellow-300 mt-1">Average</div>
          </div>
          <div className="bg-gradient-to-br from-red-500/20 to-rose-500/20 border border-red-500/30 rounded-xl p-4 md:p-5 shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-sm text-red-300 mb-1 flex items-center gap-1">
              <DollarSign size={14} />
              Monthly Bill
            </div>
            <div className="text-3xl font-bold text-red-400 animate-pulse" title="Estimated total monthly cost">${bill.totalCost.toFixed(2)}</div>
            <div className="text-xs text-red-300 mt-1">Estimated</div>
          </div>
        </div>
      </div>
    </div>

      {/* Main Content Grid */}

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 mt-6 mb-12">
        {/* Left Panel - Add Appliances */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 md:p-8 border border-slate-700 shadow-xl">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Plus className="text-green-400" size={24} />
              Add Appliances & Devices
            </h2>
            
            {Object.entries(groupedTemplates).map(([category, templates]) => (
              <div key={category} className="mb-6">
                <h3 className="text-sm font-semibold text-slate-400 mb-2">{category}</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-4 gap-2 md:gap-3">
                  {templates.map(({ key, name, icon, watts }) => (
                    <button
                      key={key}
                      onClick={() => addAppliance(key)}
                      className="flex flex-col items-center gap-1 p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-all transform hover:scale-105 shadow-md hover:shadow-lg text-sm"
                    >
                      <span className="text-2xl">{icon}</span>
                      <span className="text-xs text-center">{name.split(' ')[0]}</span>
                      <span className="text-xs text-slate-400">{watts}W</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Custom Appliance */}
            <div className="mt-6 pt-6 border-t border-slate-700">
              <h3 className="text-sm font-semibold text-slate-400 mb-3">Custom Device</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <input
                  type="text"
                  placeholder="Device name"
                  value={customAppliance.name}
                  onChange={(e) => setCustomAppliance({...customAppliance, name: e.target.value})}
                  className="col-span-2 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                />
                <input
                  type="number"
                  placeholder="Watts"
                  value={customAppliance.watts}
                  onChange={(e) => setCustomAppliance({...customAppliance, watts: Number(e.target.value)})}
                  className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                />
                <input
                  type="number"
                  placeholder="Hours/day"
                  value={customAppliance.hoursPerDay}
                  onChange={(e) => setCustomAppliance({...customAppliance, hoursPerDay: Number(e.target.value)})}
                  className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                />
                <button
                  onClick={addCustomAppliance}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-md hover:shadow-lg text-sm"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Active Appliances List */}
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 md:p-8 border border-slate-700 shadow-xl">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Zap className="text-yellow-400" size={24} />
              Your Devices ({appliances.length})
            </h2>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {appliances.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Zap size={48} className="mx-auto mb-2 opacity-30" />
                  <p>No appliances added yet</p>
                  <p className="text-sm mt-1">Add devices above to see your usage</p>
                </div>
              ) : (
                appliances.map(appliance => {
                  const dailyKwh = (appliance.watts * appliance.hoursPerDay * appliance.quantity) / 1000;
                  const monthlyCost = dailyKwh * 30 * baseRate;
                  
                  return (
                    <div key={appliance.id} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 hover:border-slate-500 transition-all duration-200 hover:shadow-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{appliance.icon}</span>
                          <div>
                            <div className="font-semibold">{appliance.name}</div>
                            <div className="text-xs text-slate-400">
                              {appliance.watts}W • {dailyKwh.toFixed(2)} kWh/day
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-yellow-400">
                            ${monthlyCost.toFixed(2)}/mo
                          </div>
                          <button
                            onClick={() => removeAppliance(appliance.id)}
                            className="mt-1 p-1.5 bg-red-500/20 hover:bg-red-500/40 rounded transition-all transform hover:scale-110 shadow-sm"
                            aria-label="Remove appliance"
                          >
                            <Trash2 size={14} className="text-red-400" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Hours per Day</label>
                          <input
                            type="number"
                            min="0"
                            max="24"
                            step="0.5"
                            value={appliance.hoursPerDay}
                            onChange={(e) => updateAppliance(appliance.id, 'hoursPerDay', e.target.value)}
                            className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Quantity</label>
                          <input
                            type="number"
                            min="1"
                            max="20"
                            value={appliance.quantity}
                            onChange={(e) => updateAppliance(appliance.id, 'quantity', e.target.value)}
                            className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Bill Breakdown */}
        <div className="space-y-6">
          {/* Bill Summary */}
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 md:p-8 border border-slate-700 shadow-xl">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <DollarSign className="text-green-400" size={24} />
              Bill Breakdown
            </h2>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                <span className="text-slate-400 text-sm">Base Load (HVAC/Structure)</span>
                <span className="font-bold">${(bill.baseLoad * baseRate).toFixed(2)}</span>
              </div>
              
              {bill.breakdown.slice(0, 5).map((item, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">{item.name}</span>
                  <span className="font-semibold text-cyan-400">${item.monthlyCost.toFixed(2)}</span>
                </div>
              ))}
              
              {bill.breakdown.length > 5 && (
                <div className="text-xs text-slate-500 text-center pt-2">
                  +{bill.breakdown.length - 5} more devices
                </div>
              )}
              
              <div className="flex justify-between items-center pt-3 border-t border-slate-700">
                <span className="text-slate-400 text-sm">Service Charge</span>
                <span className="font-bold">${bill.serviceCharge.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center pt-3 border-t-2 border-slate-600">
                <span className="font-bold text-lg">Total Estimated Bill</span>
                <span className="font-bold text-2xl text-green-400">${bill.totalCost.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Top Energy Users */}
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 md:p-8 border border-slate-700 shadow-xl">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="text-red-400" size={24} />
              Top Energy Users
            </h2>
            
            <div className="space-y-3">
              {bill.breakdown.slice(0, 5).map((item, i) => {
                const percent = (item.monthlyCost / bill.totalCost) * 100;
                return (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-semibold">{item.name}</span>
                      <span className="text-xs text-slate-400">{percent.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {item.monthlyKwh.toFixed(1)} kWh/month
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Savings Tips */}
          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-xl p-6">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <AlertCircle className="text-blue-400" size={20} />
              Money-Saving Tips
            </h2>
            <div className="space-y-2 text-sm">
              {bill.totalCost > 200 && (
                <div className="bg-slate-800/50 rounded p-2">
                  💡 Your bill is high. Consider reducing A/C usage during peak hours.
                </div>
              )}
              {appliances.some(a => a.name.includes('Dryer')) && (
                <div className="bg-slate-800/50 rounded p-2">
                  🌞 Line-dry clothes to save on dryer costs (~$30/month).
                </div>
              )}
              {appliances.some(a => a.name.includes('Pool')) && (
                <div className="bg-slate-800/50 rounded p-2">
                  🏊 Run pool pump off-peak hours (9pm-3pm) for savings.
                </div>
              )}
              {season === 'summer' && (
                <div className="bg-slate-800/50 rounded p-2">
                  ❄️ Set A/C to 78°F when home, 82°F when away.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SRPBillSimulator;