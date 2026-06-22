# ARUNA Database ERD (Entity Relationship Diagram)

This document maps the relationships between database tables for the ARUNA MVP. The schema is optimized for Supabase (PostgreSQL) and supports multi-cooperative supply aggregation.

## Mermaid Diagram

```mermaid
erDiagram
    COOPERATIVES ||--o{ COMMODITIES : "produces"
    COOPERATIVES ||--o| COOPERATIVE_SCORES : "has score"
    COOPERATIVES ||--o{ INSIGHTS : "receives"
    COOPERATIVES ||--o{ SUPPLY_MATCHES : "supplies"
    
    BUYERS ||--o{ MARKET_REQUESTS : "places"
    
    MARKET_REQUESTS ||--o{ SUPPLY_MATCHES : "fulfilled_by"
    
    COOPERATIVES {
        uuid id PK
        varchar name
        varchar province
        varchar city
        decimal latitude
        decimal longitude
        int member_count
        int active_members
        decimal annual_revenue
        timestamp created_at
    }
    
    COMMODITIES {
        uuid id PK
        uuid cooperative_id FK
        varchar name
        varchar category
        decimal monthly_capacity
        decimal available_stock
        varchar unit
        varchar harvest_period
        timestamp created_at
    }
    
    BUYERS {
        uuid id PK
        varchar company_name
        varchar city
        varchar industry
        timestamp created_at
    }
    
    MARKET_REQUESTS {
        uuid id PK
        uuid buyer_id FK
        varchar commodity_name
        decimal quantity
        varchar unit
        varchar status
        timestamp created_at
    }
    
    SUPPLY_MATCHES {
        uuid id PK
        uuid request_id FK
        uuid cooperative_id FK
        decimal allocated_quantity
        timestamp matched_at
    }
    
    COOPERATIVE_SCORES {
        uuid id PK
        uuid cooperative_id FK
        decimal health_score
        decimal growth_score
        decimal supply_score
        decimal final_score
        varchar grade
        timestamp updated_at
    }
    
    INSIGHTS {
        uuid id PK
        uuid cooperative_id FK "nullable"
        varchar title
        text description
        text recommendation
        varchar severity
        timestamp created_at
    }
```

## Description of Relations

1. **cooperatives to commodities** (1:N): Each cooperative can offer multiple commodities (e.g., Koperasi Boyolali can produce both Susu Sapi and Daging Sapi).
2. **cooperatives to cooperative_scores** (1:1): Each cooperative has a single scorecard detailing its health rating and overall letter grade.
3. **cooperatives to insights** (1:N): Individual cooperatives receive multiple rule-based insights. An insight with a NULL `cooperative_id` is classified as a National Insight.
4. **buyers to market_requests** (1:N): Large commercial buyers can issue multiple demand requests for different commodities.
5. **market_requests & cooperatives to supply_matches** (M:N via Junction Table): This represents the **Gotong Royong** mechanism where multiple cooperatives pool their supplies to fulfill a single large request.
