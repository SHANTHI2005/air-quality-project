package com.airquality.api;

import jakarta.persistence.*;  // tools for database mapping

// this tells Spring "this class = one row in the database table"
@Entity
@Table(name = "air_quality_readings")
public class AirQualityReading {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String timestamp;
    private Integer aqi;
    private Double co;
    private Double no2;
    private Double o3;
    private Double pm2_5;
    private Double pm10;

    // --- getters (how other code reads these values) ---
    public Long getId()        { return id; }
    public String getTimestamp() { return timestamp; }
    public Integer getAqi()    { return aqi; }
    public Double getCo()      { return co; }
    public Double getNo2()     { return no2; }
    public Double getO3()      { return o3; }
    public Double getPm2_5()   { return pm2_5; }
    public Double getPm10()    { return pm10; }
}
