# **Aido**

## **Product Requirements Document**

**Product:** Aido  
**Category:** Investment Intelligence Platform  
**Primary Market:** Nigerian equities / NGX  
**Platform Priority:** Mobile-first  
**Primary Users:** Emerging and active Nigerian retail investors

---

# **1\. Product Vision**

Aido is a mobile-first investment intelligence platform designed to transform complex Nigerian stock-market and financial information into **clear, personalized and explainable investment intelligence**.

Aido should help an investor answer three questions:

1. **Is this stock attractive at its current price?**  
2. **What should I do about it — Buy, Hold, Sell or Watch?**  
3. **Does it make sense for me, given my risk tolerance, investment horizon, goals and existing portfolio?**

Aido's recommendations should never be black-box conclusions. Every recommendation should have an understandable rationale, while deeper analysis remains available when requested.

---

# **2\. Product Philosophy**

Aido should be built around six principles.

### **2.1 Intelligence over information**

Aido should not simply reproduce market data, financial statements and news.

It should interpret them.

**Raw data → Analysis → Insight → Recommendation → Explanation**

---

### **2.2 Opportunity ≠ Suitability**

A stock can be an attractive market opportunity without being appropriate for a particular investor.

Aido should therefore maintain two distinct concepts:

**Market Opportunity**

> How attractive is this stock based on its fundamentals, valuation, growth prospects, market behaviour and risks?

**Personal Suitability**

> How appropriate is this stock for this particular investor?

This distinction should be fundamental to Aido.

---

### **2.3 Price matters**

Aido should distinguish between:

> **“This is a good company.”**

and:

> **“This is a good investment at this price.”**

A high-quality company can receive HOLD if its valuation is excessive.

A less exceptional company can receive BUY if its current valuation creates a sufficiently attractive risk/reward opportunity.

---

### **2.4 Explain, don't dictate**

Aido should provide investment intelligence rather than pretending to know the future.

Every recommendation should communicate:

* What Aido thinks  
* Why Aido thinks it  
* What could invalidate the thesis  
* How suitable it is for the investor

---

### **2.5 Don't force recommendations**

Aido should be comfortable saying:

> **No strong opportunity identified this week.**

A BUY recommendation should mean something.

---

### **2.6 Progressive disclosure**

The default experience should be concise and mobile-friendly.

Investors who want deeper analysis should be able to progressively explore the evidence.

---

# **3\. Target Users**

## **Primary**

### **Emerging Investors**

Investors who:

* Understand basic investing concepts  
* Own or are considering owning NGX stocks  
* Can read basic financial information but don't want to perform extensive analysis manually  
* Want clearer explanations and better decision support

### **Active Retail Investors**

Investors who:

* Regularly monitor NGX stocks  
* Research companies and sectors  
* Manage their own portfolios  
* Want faster access to meaningful analysis  
* Want recommendations contextualized to their portfolio

## **Secondary**

Beginners can use Aido, but education should support the product rather than become its primary purpose.

---

# **4\. Core User Jobs**

Aido should help users:

### **Discover**

Find potentially attractive NGX opportunities.

### **Evaluate**

Understand whether a stock is fundamentally and financially attractive.

### **Decide**

Determine whether the appropriate action is BUY, HOLD, SELL or WATCH.

### **Personalize**

Determine whether the opportunity fits their circumstances.

### **Monitor**

Understand changes in stocks and portfolios over time.

### **Learn**

Understand why Aido reached a particular conclusion.

---

# **5\. Investor Onboarding**

Aido should create a **Personal Investor Profile** using six primary inputs.

### **Risk tolerance**

* Conservative  
* Moderate  
* Aggressive

### **Investment horizon**

* Short term  
* Medium term  
* Long term

### **Primary objective**

* Capital growth  
* Dividend income  
* Wealth preservation  
* Income  
* Combination

### **Available investment capital**

### **Investment frequency**

* One-off  
* Monthly  
* Irregular

### **Existing portfolio**

The onboarding experience should remain short.

Aido should progressively learn more about the investor through their behaviour and interactions rather than demanding an extensive questionnaire upfront.

The investor should be able to edit their profile at any time.

---

# **6\. NGX Stock Universe**

Aido should analyze the **broad NGX equity universe** within its available data coverage.

Stocks should be dynamically classified into multiple investment categories.

### **Core categories**

* Established / Large-cap  
* Growth  
* Dividend  
* Value  
* High Growth / High Risk  
* Turnaround  
* Speculative

A stock can belong to more than one category.

Classification should evolve as the underlying characteristics of the company change.

---

# **7\. Stock Analysis Engine**

Aido should analyze seven major dimensions.

## **7.1 Fundamental Health**

Analyze factors such as:

* Revenue  
* Earnings  
* Profit margins  
* Cash flow  
* Return on equity  
* Return on assets  
* Debt and leverage  
* Balance-sheet strength  
* Earnings quality

---

## **7.2 Valuation**

Assess:

* P/E  
* P/B  
* EV/EBITDA  
* Dividend yield  
* Historical valuation  
* Peer valuation  
* Current price relative to underlying fundamentals

The objective is not merely to report ratios but to answer:

> **Is the current price reasonable relative to the company's fundamentals?**

---

## **7.3 Growth**

Analyze:

* Revenue growth  
* Earnings growth  
* Profitability trends  
* Business expansion  
* Earnings trajectory  
* Relevant sector conditions

---

## **7.4 Market Behaviour**

Analyze:

* Price momentum  
* Volatility  
* Trading activity  
* Liquidity  
* Recent performance  
* Relevant price trends

Market behaviour should complement fundamental analysis rather than replace it.

---

## **7.5 Dividend Intelligence**

Analyze:

* Dividend history  
* Dividend yield  
* Dividend growth  
* Payout ratio  
* Dividend consistency  
* Sustainability

This should be particularly important for investors whose primary objective is income.

---

## **7.6 Risk**

Identify:

* Financial risk  
* Valuation risk  
* Market risk  
* Sector risk  
* Company-specific risk  
* Liquidity risk  
* Relevant macroeconomic exposure

Aido should clearly communicate **what could go wrong**.

---

## **7.7 News & Corporate Events**

Monitor material developments including:

* Financial results  
* Corporate announcements  
* Regulatory developments  
* Management changes  
* Corporate actions  
* Major business developments  
* Material market news

News should influence analysis when it has a meaningful impact on the investment thesis.

---

# **8\. Aido Score**

Each stock should receive an **Aido Score out of 100**.

The score should synthesize multiple dimensions rather than represent a single financial ratio.

Potential components include:

* Fundamental strength  
* Valuation  
* Growth  
* Financial quality  
* Dividend quality  
* Market behaviour  
* Risk

The weighting should reflect the characteristics of the investment and, where appropriate, the investor's objectives.

The score should be accompanied by a **confidence level**.

Example:

> **82/100**  
> **High Confidence**

The score should support the recommendation, not replace it.

---

# **9\. Recommendation System**

Aido's principal investment actions should be:

### **BUY**

A sufficiently attractive opportunity at the current price, subject to the investor's circumstances.

### **HOLD**

The stock may remain fundamentally attractive, but the current price, risk/reward profile or circumstances do not justify a new BUY.

### **SELL**

The analysis indicates that reducing or exiting the position warrants consideration.

### **WATCH**

Potentially interesting, but evidence or valuation is not currently strong enough for a BUY.

### **NO STRONG OPPORTUNITY**

Used when Aido cannot identify an opportunity that meets its required threshold.

The recommendation should consider both:

**Absolute investment attractiveness \+ current valuation**

---

# **10\. Recommendation Display**

The default stock recommendation should be concise.

Example:

> ## **BUY**

> **Aido Score: 82/100**  
> **Confidence: High**

> **Why Aido recommends it**

> * Earnings are accelerating  
> * Valuation remains reasonable  
> * Business fundamentals are improving

> **Key risk**

> * Significant sector exposure

> **Your suitability**  
> **High**

The investor can then select **“View Analysis”** or **“Why?”** to access the complete investment thesis.

---

# **11\. Investment Thesis**

The full thesis should **not automatically overwhelm the investor**.

It should be available on demand.

The detailed thesis can cover:

### **Investment case**

Why the stock is attractive.

### **Fundamental case**

What the financial statements indicate.

### **Valuation case**

Whether the current price is justified.

### **Growth case**

What could drive future performance.

### **Dividend case**

Where relevant.

### **Risk case**

What could go wrong.

### **Catalysts**

Events or developments that could materially change the outlook.

### **Contradictory evidence**

Information that argues against the thesis.

### **Portfolio relevance**

How the stock interacts with the investor's existing portfolio.

### **Bottom line**

A concise synthesis of the entire analysis.

---

# **12\. Personalized Suitability**

Aido should separately evaluate:

**Stock attractiveness**

and

**Investor suitability.**

For example:

> **ABC Plc**

> Aido Score: **86/100**

> **Market Opportunity:** Attractive  
> **Your Suitability:** Low

> High volatility makes the stock inconsistent with your conservative, short-term investment profile.

Stocks that are attractive but unsuitable should not disappear.

Instead, they should appear under:

## **Outside Your Profile**

This preserves market discovery without confusing it with personalized advice.

---

# **13\. Portfolio Intelligence**

Aido should include a comprehensive portfolio layer.

Users should be able to record:

* Stocks owned  
* Quantity  
* Purchase price  
* Average cost  
* Current value  
* Gains/losses  
* Dividends

Aido should then analyze the portfolio as a whole.

### **Portfolio analysis should include:**

* Sector allocation  
* Stock concentration  
* Risk exposure  
* Diversification  
* Portfolio performance  
* Dividend exposure  
* Growth exposure  
* Potential weaknesses

---

# **14\. Portfolio-Aware Recommendations**

Aido should not make recommendations in isolation.

It should consider the investor's existing holdings.

For example:

> **ABC Plc — BUY**

> This stock fits your long-term growth profile.

> **Portfolio impact:** Your financial-sector exposure would increase from 18% to 24%.

This allows Aido to answer a more sophisticated question:

> **“Should I buy this stock?”**

and eventually:

> **“Should I add this stock to my portfolio?”**

The second question is more valuable.

---

# **15\. Stock Discovery**

Users should be able to discover stocks through several paths.

### **Personalized discovery**

> Stocks that fit your profile

### **Market discovery**

> Interesting opportunities across NGX

### **Investment style**

* Growth  
* Value  
* Dividend  
* Large-cap  
* Turnaround  
* High-risk/high-growth  
* Speculative

### **Portfolio-driven discovery**

> Stocks that could improve diversification

### **Search**

Users should be able to search directly for a company or stock.

---

# **16\. Weekly Aido Recommendation**

Aido should deliver a **weekly stock recommendation on weekends**, preferably Sunday.

There should be two layers.

## **Aido Pick of the Week**

A broader market recommendation visible to all users.

## **Your Aido Pick**

A personalized recommendation based on:

* Investor profile  
* Existing portfolio  
* Current market conditions  
* Stock valuation  
* Risk/reward  
* Recent developments

The personalized recommendation should receive greater prominence.

---

# **17\. Weekly Recommendation Philosophy**

Aido should not force a BUY every week.

Possible outcomes:

### **Strong opportunity**

> BUY

### **Promising opportunity**

> WATCH

### **Nothing compelling**

> No strong recommendation this week.

This should be treated as a feature, not a failure.

---

# **18\. Push Notification**

The notification should be concise and designed to generate interest without presenting the entire analysis.

Example:

> **Your Aido Pick is in 🎯**

> **ABC Plc — BUY**  
> 84/100 · High Confidence

> Strong growth \+ reasonable valuation.

> **View recommendation →**

A separate market-wide notification could say:

> **Aido Pick of the Week**

> **XYZ Plc — 87/100**

> One NGX stock worth watching this week.

> **Explore →**

The notification should link directly to the relevant analysis.

---

# **19\. Recommendation Personalization**

Aido should eventually distinguish between:

### **Market recommendation**

> “This stock looks attractive.”

### **Personal recommendation**

> “This stock looks attractive **and fits your profile and portfolio**.”

The latter should be the core of Aido's personalization engine.

---

# **20\. Watchlist**

Users should be able to maintain a personal watchlist.

For each watched stock, Aido should monitor meaningful changes such as:

* Valuation  
* Earnings  
* Financial results  
* Price movement  
* Dividend announcements  
* Material news  
* Risk profile  
* Aido Score  
* Recommendation changes

Aido should notify users when something **material changes**, rather than generating unnecessary alerts.

---

# **21\. Recommendation Change Alerts**

Aido should notify investors when its view materially changes.

Examples:

> **Aido changed ABC from WATCH → BUY**

or:

> **Aido changed XYZ from BUY → HOLD**

The notification should briefly explain **what changed**.

This is important because users should understand that Aido's recommendations are dynamic rather than permanent labels.

---

# **22\. Explainability**

Every recommendation should answer:

### **Why?**

Why does Aido believe this?

### **Why now?**

What makes the opportunity relevant at the current price/time?

### **Why for me?**

Why is it or isn't it suitable for this investor?

### **What could go wrong?**

What are the principal risks?

This four-part framework can become a defining characteristic of Aido.

---

# **23\. Confidence**

Aido should communicate confidence separately from the recommendation.

Example:

> **BUY**  
> Score: 84/100  
> Confidence: **High**

Confidence should reflect the **strength and consistency of the evidence**, not merely the magnitude of the score.

A stock with an attractive score but limited or conflicting evidence should not automatically receive high confidence.

---

# **24\. Comparison**

Aido should allow investors to compare stocks.

Comparison should cover areas such as:

* Fundamental strength  
* Valuation  
* Growth  
* Dividends  
* Risk  
* Market behaviour  
* Aido Score  
* Suitability

The objective is not simply to declare a winner.

It should help investors understand:

> **“How are these investment opportunities different?”**

---

# **25\. Investor Dashboard**

The home experience should prioritize information relevant to the individual investor.

Potential sections:

### **Your Portfolio**

Current position and important changes.

### **Your Opportunities**

Stocks Aido considers relevant to the investor.

### **Your Watchlist**

Important developments.

### **Your Aido Pick**

Personalized weekly recommendation.

### **Aido Pick of the Week**

Broader market opportunity.

### **Market Pulse**

Important NGX developments.

### **Alerts**

Changes requiring attention.

---

# **26\. Market Intelligence**

Aido should provide a concise view of the NGX environment.

Potential areas:

* Market direction  
* Sector performance  
* Major gainers/decliners  
* Significant corporate events  
* Dividend activity  
* Earnings season  
* Notable valuation changes  
* Important macroeconomic developments

The emphasis should remain on **interpretation rather than information overload**.

---

# **27\. Financial Calendar**

Aido should help investors track relevant events such as:

* Earnings releases  
* Annual general meetings  
* Dividend declarations  
* Qualification dates  
* Payment dates  
* Corporate actions  
* Other material company events

Events should be linked to their potential relevance to the investor's holdings or watchlist.

---

# **28\. Dividend Intelligence**

Because dividends are particularly important to many NGX investors, Aido should eventually provide a dedicated dividend experience.

Investors should be able to see:

* Dividend history  
* Dividend yield  
* Dividend consistency  
* Dividend growth  
* Payout trends  
* Estimated portfolio dividend income  
* Upcoming relevant dividend events

For dividend-focused investors, dividend intelligence should influence stock discovery and personalized recommendations more heavily.

---

# **29\. Search Experience**

Aido's search should support natural investment questions.

Examples:

> “Show me dividend stocks suitable for moderate risk.”

> “Which banking stocks have attractive valuations?”

> “Why did Aido change ABC to HOLD?”

> “Find growth stocks suitable for a five-year horizon.”

> “Which stocks could diversify my current portfolio?”

This moves Aido beyond being a conventional stock database.

---

# **30\. AI Conversation Layer**

Aido should eventually allow investors to ask questions about the analysis.

For example:

> “Why did you rate this BUY?”

> “What is the biggest risk?”

> “What would make you change this recommendation?”

> “How does this compare with my current holdings?”

> “Explain the valuation like I'm new to investing.”

The conversational layer should explain Aido's existing analysis rather than inventing unsupported conclusions.

---

# **31\. Alerts**

Users should have control over meaningful alerts.

Possible alert categories:

* Recommendation changes  
* Aido Score changes  
* Significant price movements  
* Earnings releases  
* Dividend announcements  
* Material company news  
* Watchlist changes  
* Portfolio changes  
* Weekly recommendation

Alerts should be useful rather than noisy.

---

# **32\. Trust & Transparency**

Aido's credibility will depend heavily on transparency.

For each recommendation, users should be able to understand:

* The major factors considered  
* The relevant period of the data  
* The principal risks  
* Why the recommendation was made  
* What could change the recommendation

Aido should clearly distinguish:

**Data**

from

**Analysis**

from

**Recommendation.**

---

# **33\. Recommendation History**

Aido should retain historical recommendations.

Users should be able to see:

* Previous recommendation  
* Current recommendation  
* Date of change  
* Reason for change  
* Historical Aido Score  
* What happened after the recommendation

This creates accountability and allows users to evaluate how Aido's analysis has performed over time.

---

# **34\. Backtesting & Performance Transparency**

Aido should eventually publish a transparent record of its recommendations.

This should include historical performance measurements and clearly defined methodology.

The purpose should be **transparency and evaluation**, not marketing claims.

Aido should avoid presenting historical performance as a guarantee of future results.

---

# **35\. Monetization Direction**

Aido should use a **freemium model**.

### **Free**

* Basic market information  
* Limited stock analysis  
* Basic watchlist  
* Basic portfolio tracking  
* Weekly Aido Pick  
* Basic recommendations

### **Premium**

* Full stock intelligence  
* Personalized recommendations  
* Advanced portfolio intelligence  
* Deeper valuation analysis  
* Advanced alerts  
* Full investment theses  
* More extensive historical analysis  
* Advanced comparisons  
* Personalized opportunity discovery

The free product should be useful enough to establish trust; Premium should provide substantially deeper intelligence rather than simply removing arbitrary restrictions.

---

# **36\. MVP**

The initial version should focus tightly on the core value proposition.

### **MVP should include:**

**Investor Profile**

* Risk  
* Horizon  
* Goal  
* Capital  
* Frequency  
* Portfolio

**NGX Stock Universe**

* Search  
* Categories  
* Stock profiles

**Stock Intelligence**

* Fundamentals  
* Valuation  
* Growth  
* Dividends  
* Risk  
* Market behaviour  
* News

**Recommendation Engine**

* BUY  
* HOLD  
* SELL  
* WATCH  
* No strong opportunity

**Aido Score**

* Score  
* Confidence  
* Explanation

**Personal Suitability**

* Suitable  
* Outside Profile  
* Portfolio relevance

**Portfolio**

* Holdings  
* Performance  
* Allocation  
* Risk  
* Dividends

**Watchlist**

**Weekly Aido Pick**

* Market-wide  
* Personalized

**Push Notifications**

This is sufficient to prove Aido's fundamental proposition without attempting to build every possible feature at launch.

---

# **37\. Post-MVP Expansion**

After validating the core product, expand into:

1. Advanced portfolio intelligence  
2. Conversational Aido  
3. Advanced stock comparison  
4. Financial calendar  
5. Advanced dividend intelligence  
6. Historical recommendation tracking  
7. Recommendation performance transparency  
8. More sophisticated investor profiling  
9. Personalized opportunity discovery  
10. Deeper market intelligence

---

# **38\. Core Product Differentiation**

Aido should not position itself as merely:

* A stock-price tracker  
* A financial-news app  
* A portfolio tracker  
* A stock screener  
* An AI chatbot  
* A stock-rating website

Its core proposition should be:

> **Aido turns NGX market data into personalized, explainable investment intelligence.**

The differentiating loop is:

**Understand the market → Analyze the stock → Assess the opportunity → Match it to the investor → Consider the existing portfolio → Explain the decision → Monitor what changes.**

---

# **39\. The Aido Decision Framework**

Every investment opportunity should ultimately pass through four questions:

### **1\. Is it good?**

**Fundamental quality**

### **2\. Is it worth the current price?**

**Valuation and risk/reward**

### **3\. Is it right for this investor?**

**Personal suitability**

### **4\. Does it make sense for this portfolio?**

**Portfolio fit**

Only after these questions should Aido produce its recommendation.

---

# **40\. Example End-to-End Experience**

An investor opens Aido.

### **Step 1**

Aido knows:

> Moderate risk  
> Long-term  
> Growth-focused  
> Monthly investor  
> Existing NGX portfolio

### **Step 2**

Aido identifies several potentially attractive stocks.

### **Step 3**

It evaluates their:

* Fundamentals  
* Valuation  
* Growth  
* Dividends  
* Market behaviour  
* Risks  
* Recent developments

### **Step 4**

Aido identifies one stock with strong fundamentals and an attractive valuation.

### **Step 5**

It evaluates suitability.

> **Suitable for your profile: High**

### **Step 6**

It evaluates portfolio impact.

> **Portfolio fit: High**

### **Step 7**

Aido produces:

> **BUY**  
> **84/100**  
> **Confidence: High**

### **Step 8**

The investor sees only the key reasons.

> Strong earnings growth  
> Attractive valuation  
> Improving profitability

### **Step 9**

The investor taps **View Analysis**.

Only then does Aido reveal the full investment thesis.

---

# **41\. North Star Metric**

Aido's ultimate success should not simply be:

> Number of users.

The stronger product metric is:

> **Percentage of active investors who regularly use Aido to make or review investment decisions.**

Supporting measures can include:

* Weekly active investors  
* Portfolio-connected users  
* Recommendation engagement  
* Watchlist engagement  
* Weekly recommendation engagement  
* Return frequency  
* Premium conversion  
* Recommendation-history usage  
* User retention

---

# **42\. Product Success Criteria**

Aido succeeds if an investor can open the app and quickly answer:

> **What is interesting in the NGX?**

> **Why is it interesting?**

> **Is it suitable for me?**

> **Does it fit my portfolio?**

> **What could go wrong?**

> **What has changed since I last looked?**

And, most importantly:

> **“I understand why Aido reached this conclusion.”**

---

# **43\. Aido's Core Product Promise**

### **Don't just know what the market is doing. Know what it means for you.**

Aido should turn the complexity of the NGX into **clear, contextual, and explainable investment intelligence**—without requiring retail investors to become professional financial analysts.

