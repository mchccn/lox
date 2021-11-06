pub type Value = f64;

pub struct ValueArray {
    pub values: Vec<Value>,
}

pub fn init_value_array() -> ValueArray {
    ValueArray { values: Vec::new() }
}

pub fn write_value_array(array: &mut ValueArray, value: Value) {
    array.values.push(value);
}

pub fn print_value(value: Value) {
    print!("{}", value);
}
