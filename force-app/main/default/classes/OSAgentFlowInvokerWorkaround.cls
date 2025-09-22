public with sharing class OSAgentFlowInvokerWorkaround {
        public class FlowResponse {
        @AuraEnabled public String sessionId;
        @AuraEnabled public String response;

        public FlowResponse(String sessionId, String response) {
            this.sessionId = sessionId;
            this.response = response;
        }
    }
    @AuraEnabled(cacheable=false)
   public static FlowResponse invokeFlow(String recordId, String sessionId, String requestText, String sessionHistoryJSON, String osJSON, String flowApiName) {
        String apiNameToInvoke = String.isBlank(flowApiName)
            ? 'Omniscript_Step_Chart_Agent'
            : flowApiName;
    
        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:ConnectAPI/services/data/v64.0/actions/custom/flow/' + apiNameToInvoke);
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');
        req.setTimeout(30000);

        Map<String, Object> payloadMap = new Map<String, Object>();
        List<Map<String, String>> inputsList = new List<Map<String, String>>();

        Map<String, String> inputMap = new Map<String, String>();
        inputMap.put('Session_Id', sessionId);
        inputMap.put('Request', requestText);
        inputMap.put('OmniscriptJSON', osJSON);
        inputsList.add(inputMap);
        payloadMap.put('inputs', inputsList);
        // Convert the Map to JSON string
        String payload = JSON.serialize(payloadMap);

        req.setBody(payload);
        // Create the HTTP client and send the request
        Http http = new Http();
        String outSessionId = '';
        String outResponse = '';
        try {
            HttpResponse res = http.send(req);
            // Handle the response
            if (res.getStatusCode() == 200) {
                List<Object> results =  (List<Object>) JSON.deserializeUntyped(res.getBody());   
                
                Map<String, Object> data = (Map<String, Object>)results[0];
                Map<String, Object> outputValues = (Map<String,Object>)data.get('outputValues');
                
                outSessionId = (String) outputValues.get('Session_Id');
            
                outResponse = (String) outputValues.get('Response');
                
                
            } else {
                System.debug('Error: ' + res.getStatusCode() + ' ' + res.getStatus());
            }
            } catch (Exception e) {
                System.debug('Exception: ' + e.getMessage());
        }
        return new FlowResponse(outSessionId, outResponse);
    }
}