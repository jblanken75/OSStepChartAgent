public class OSAgentGetOSFromDM {
    @InvocableMethod
    public static List<Response> getPrompt(List<Request> requests) {
        Request input = requests[0];
        
        List<Response> responses = new List<Response>();
        Response output = new Response();
        responses.add(output);
   
       
        
        /* Specify Data Mapper extract or transform to call */
        String bundleName = 'OSAgentGetOSDetails'; 
        
        /* Populate the input JSON */
        Map<String, Object> objectList = new Map<String, Object>{'OSId'=>input.OSId}; 
        
        /* Call the Data Mapper */
        String jsonString = JSON.serialize(objectList);
        List<String> jsonInputData = new List<String>();
        jsonInputData.add(jsonString);
        ConnectApi.DataMapperExecuteInputRepresentation apexInput = new ConnectApi.DataMapperExecuteInputRepresentation();
        apexInput.dataMapperInput = jsonInputData;
        apexInput.inputType = 'JSON';
        ConnectApi.DataMapperExecuteOptionsRepresentation options = new ConnectApi.DataMapperExecuteOptionsRepresentation();
        options.locale = null;
        options.shouldSendLegacyResponse = true;
        apexInput.options = options;
        ConnectApi.DataMapperExecuteOutputRepresentation DMoutput = ConnectApi.OmniDesignerConnect.executeDataMapper(bundleName, apexInput);
        
        /* Process the results returned by a Data Mapper Extract or Transform */
        List<String> innerResponse = DMoutput.response;
        for (String currentResponse : innerResponse){
            Map<String, Object> outerMap = (Map<String, Object>) JSON.deserializeUntyped(currentResponse);
            List<String> keys = new List<String>(outerMap.keySet());
            output.Prompt = JSON.serialize(outerMap.get('response'));
        }
       
        return responses;
    }
 
    // Type and API Name of all variables must match the template
    public class Request {
        @InvocableVariable(required=true)
        public String OSId;
    }

    public class Response {
        @InvocableVariable
        public String Prompt; // Must be named "Prompt"
    }
}