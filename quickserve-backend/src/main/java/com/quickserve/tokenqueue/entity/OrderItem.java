package com.quickserve.tokenqueue.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

/** One item within an order, e.g. { name: "Biryani", complexity: 3 }. */
@Embeddable
public class OrderItem {

    @Column(name = "item_name")
    private String name;

    /** 1 = Simple, 2 = Medium, 3 = Complex */
    @Column(name = "item_complexity")
    private int complexity;

    public OrderItem() {
    }

    public OrderItem(String name, int complexity) {
        this.name = name;
        this.complexity = complexity;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getComplexity() {
        return complexity;
    }

    public void setComplexity(int complexity) {
        this.complexity = complexity;
    }
}
