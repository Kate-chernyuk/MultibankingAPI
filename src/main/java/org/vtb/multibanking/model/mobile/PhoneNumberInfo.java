package org.vtb.multibanking.model.mobile;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.vtb.multibanking.model.Amount;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PhoneNumberInfo {
    private String number;
    private Amount minSum;
    private Amount maxSum;
    private List<Amount> recommendedSums = new ArrayList<Amount>();
    private MobileProvider mobileProvider;
}
