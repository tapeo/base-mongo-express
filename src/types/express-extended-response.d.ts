declare namespace Express {
  export interface Response {
    jsonTyped: (data: import("./typed-response").JsonTyped) => void;
  }
}
