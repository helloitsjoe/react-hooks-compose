import React from "react";
import { shallow } from "enzyme";
import compose from "../index";

test("returns component if no hooks", () => {
  const Component = () => <div>Test</div>;
  const Container = compose()(Component);
  const wrapper = shallow(<Container />);
  expect(wrapper.html()).toMatchInlineSnapshot(`"<div>Test</div>"`);
});
