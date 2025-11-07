package org.vtb.multibanking.model.mobile;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MobileProvider {
    private String id;
    private String name;
    private String type;
    private String shortName;
}
