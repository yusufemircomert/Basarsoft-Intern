namespace BasarsoftStaj
{
    public class Response<T>
    {
        public bool Status { get; set; }  
        public string Message { get; set; }  
        public T Value { get; set; } 

        public Response() { }

        public Response(bool status, string message, T value)
        {
            Status = status;
            Message = message;
            Value = value;
        }
    }
}
