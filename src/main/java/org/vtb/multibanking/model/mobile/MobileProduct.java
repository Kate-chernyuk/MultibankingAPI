package org.vtb.multibanking.model.mobile;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.vtb.multibanking.model.Amount;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MobileProduct {
    private String entityName;
    private String alias;
    private String publicId;
    private String productType;
    private Amount amount;
}
