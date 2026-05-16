
```javascript
const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic();

// Portfolio simulator with Claude integration
class PortfolioSimulator {
  constructor() {
    this.portfolio = {
      stocks: {},
      bonds: {},
      cash: 1000,
    };
    this.history = [];
    this.conversationHistory = [];
  }

  addAsset(type, symbol, quantity, price) {
    if (type === "stocks") {
      this.portfolio.stocks[symbol] = {
        quantity,
        purchasePrice: price,
        currentPrice: price,
      };
    } else if (type === "bonds") {
      this.portfolio.bonds[symbol] = {
        quantity,
        purchasePrice: price,
        currentPrice: price,
        yield: 0.03,
      };
    }
  }

  simulateMarketChange() {
    const change = (Math.random() - 0.5) * 0.1; // -5% to +5%

    for (const symbol in this.portfolio.stocks) {
      const asset = this.portfolio.stocks[symbol];
      asset.currentPrice *= 1 + change;
    }

    for (const symbol in this.portfolio.bonds) {
      const asset = this.portfolio.bonds[symbol];
      asset.currentPrice *= 1 + change * 0.3; // Bonds are less volatile
    }

    this.recordHistory();
  }

  recordHistory() {
    this.history.push({
      timestamp: new Date(),
      portfolio: JSON.parse(JSON.stringify(this.portfolio)),
      totalValue: this.calculateTotalValue(),
    });
  }

  calculateTotalValue() {
    let total = this.portfolio.cash;

    for (const symbol in this.portfolio.stocks) {
      const asset = this.portfolio.stocks[symbol];
      total += asset.quantity * asset.currentPrice;
    }

    for (const symbol in this.portfolio.bonds) {
      const asset = this.portfolio.bonds[symbol];
      total += asset.quantity * asset.currentPrice;
    }

    return total;
  }

  getPortfolioSummary() {
    const summary = {
      cash: this.portfolio.cash,
      stocks: {},
      bonds: {},
      totalValue: this.calculateTotalValue(),
    };

    for (const symbol in this.portfolio.stocks) {
      const asset = this.portfolio.stocks[symbol];
      summary.stocks[symbol] = {
        quantity: asset.quantity,
        currentPrice: asset.currentPrice.toFixed(2),
        value: (asset.quantity * asset.currentPrice).toFixed(2),
        gain: (
          ((asset.currentPrice - asset.purchasePrice) / asset.purchasePrice) *
          100
        ).toFixed(2),
      };
    }

    for (const symbol in this.portfolio.bonds) {
      const asset = this.portfolio.bonds[symbol];
      summary.bonds[symbol] = {
        quantity: asset.quantity,
        currentPrice: asset.currentPrice.toFixed(2),
        value: (asset.quantity * asset.currentPrice).toFixed(2),
        yieldPercent: (asset.yield * 100).toFixed(2),
      };
    }

    return summary;
  }

  generateAsciiChart() {
    if (this.history.length < 2) {
      return "Not enough data for chart";
    }

    const values = this.history.map((h) => h.totalValue);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue || 1;

    let chart = "\n╔════════════════════════════════════════╗\n";
    chart += "║         PORTFOLIO VALUE CHART          ║\n";
    chart += "╠════════════════════════════════════════╣\n";

    const chartHeight = 15;
    for (let i = chartHeight; i >= 0; i--) {
      const threshold = minValue + (range * i) / chartHeight;
      let line = "║ ";

      for (let j = 0; j < values.length; j++) {
        if (values[j] >= threshold) {
          line += "█";
        } else {
          line += " ";
        }
      }

      line += " ║";
      chart += line + "\n";
    }

    chart += "╠════════════════════════════════════════╣\n";
    chart += `║ Min: $${minValue.toFixed(0).padEnd(9)}  Max: $${maxValue.toFixed(0).padEnd(9)}  ║\n`;
    chart += "╚════════════════════════════════════════╝\n";

    return chart;
  }

  async analyzeWithClaude() {
    const summary = this.getPortfolioSummary();
    const userMessage = `Please analyze this investment portfolio and provide recommendations:
${JSON.stringify(summary, null, 2)}

Current historical data points: ${this.history.length}
Total portfolio value: $${summary.totalValue.toFixed(2)}`;

    this.conversationHistory.push({
      role: "user",
      content: userMessage,
    });

    const response = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      system:
        "You are an expert financial advisor analyzing investment portfolios. Provide concise, actionable insights and recommendations based on the portfolio composition, diversification, and performance.",
      messages: this.conversationHistory,
    });

    const assistantMessage =
      response.content[0].type === "text" ? response.content[0].text : "";

    this.conversationHistory.push({
      role: "assistant",
      content: assistantMessage,
    });

    return assistantMessage;
  }

  async askClaudeQuestion(question) {
    const summary = this.getPort