package org.vtb.multibanking.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AccountIdentification {
    private String schemeName;
    private String identification;
    private String name;
}